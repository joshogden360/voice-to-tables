import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const send = mutation({
  args: {
    sessionId: v.string(),
    role: v.string(),
    content: v.string(),
    action: v.optional(v.object({
      type: v.string(),
      args: v.optional(v.any()),
    })),
    actionData: v.optional(v.object({
      title: v.string(),
      columns: v.array(v.string()),
      rows: v.array(v.any()),
      summary: v.optional(v.string()),
    })),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    const userId = identity.subject;
    const timestamp = Date.now();
    
    // Insert message with user ownership
    await ctx.db.insert("messages", { 
      userId,
      sessionId: args.sessionId,
      role: args.role,
      content: args.content,
      timestamp,
      action: args.action,
      actionData: args.actionData,
    });
    
    // Update session activity
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .unique();
    
    if (session) {
      // Ensure user owns this session before updating activity
      if (session.userId === userId) {
        await ctx.db.patch(session._id, {
          lastActiveAt: timestamp,
        });
      }
    }
    
    // If the message contains table data, update the session's active table
    if (args.actionData) {
      const existing = await ctx.db
        .query("tables")
        .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
        .unique();
        
      if (existing) {
        if (existing.userId === userId) {
          await ctx.db.patch(existing._id, {
            title: args.actionData.title,
            columns: args.actionData.columns,
            rows: args.actionData.rows,
            summary: args.actionData.summary,
            lastUpdatedAt: timestamp,
          });
        }
      } else {
        await ctx.db.insert("tables", {
          userId,
          sessionId: args.sessionId,
          title: args.actionData.title,
          columns: args.actionData.columns,
          rows: args.actionData.rows,
          summary: args.actionData.summary,
          createdAt: timestamp,
          lastUpdatedAt: timestamp,
        });
      }
    }
  },
});

export const list = query({
  args: { 
    sessionId: v.string() 
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }
    const userId = identity.subject;

    // Only return messages for this user and session (data isolation)
    return await ctx.db
      .query("messages")
      .withIndex("by_user_session", (q) => 
        q.eq("userId", userId).eq("sessionId", args.sessionId)
      )
      .order("asc")
      .collect();
  },
});

export const listByUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }
    const userId = identity.subject;

    // Get all messages for a user (across all sessions)
    return await ctx.db
      .query("messages")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(100); // Limit to recent 100 messages
  },
});

export const clear = mutation({
  args: { 
    sessionId: v.string() 
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    const userId = identity.subject;

    // Only clear messages that belong to this user (security)
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_user_session", (q) => 
        q.eq("userId", userId).eq("sessionId", args.sessionId)
      )
      .collect();
    
    for (const msg of messages) {
      await ctx.db.delete(msg._id);
    }
    
    // Clear table for this session
    const table = await ctx.db
      .query("tables")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .unique();
    
    if (table && table.userId === userId) {
      await ctx.db.delete(table._id);
    }
  },
});
