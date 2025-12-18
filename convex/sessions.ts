import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Session management functions
 * Handles user sessions across platforms (web, iOS, Android)
 */

export const createSession = mutation({
  args: {
    sessionId: v.string(),
    platform: v.string(),
    templateId: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    const userId = identity.subject;
    const timestamp = Date.now();
    
    // Check if session already exists
    const existing = await ctx.db
      .query("sessions")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .unique();
    
    if (existing) {
      // Security check: ensure user owns this session
      if (existing.userId !== userId) {
        throw new Error("Session access denied");
      }
      
      // Update existing session
      await ctx.db.patch(existing._id, {
        lastActiveAt: timestamp,
        isActive: true,
        templateId: args.templateId,
      });
      return existing._id;
    } else {
      // Create new session
      return await ctx.db.insert("sessions", {
        userId,
        sessionId: args.sessionId,
        platform: args.platform,
        templateId: args.templateId,
        createdAt: timestamp,
        lastActiveAt: timestamp,
        isActive: true,
      });
    }
  },
});

export const updateSessionActivity = mutation({
  args: {
    sessionId: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    const userId = identity.subject;

    const session = await ctx.db
      .query("sessions")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .unique();
    
    if (session && session.userId === userId) {
      await ctx.db.patch(session._id, {
        lastActiveAt: Date.now(),
      });
    }
  },
});

export const closeSession = mutation({
  args: {
    sessionId: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    const userId = identity.subject;

    const session = await ctx.db
      .query("sessions")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .unique();
    
    if (session && session.userId === userId) {
      await ctx.db.patch(session._id, {
        isActive: false,
        lastActiveAt: Date.now(),
      });
    }
  },
});

export const listUserSessions = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }
    const userId = identity.subject;

    return await ctx.db
      .query("sessions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(10); // Recent 10 sessions
  },
});

export const getActiveSession = query({
  args: { 
    sessionId: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }
    const userId = identity.subject;

    const session = await ctx.db
      .query("sessions")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .unique();
    
    // Only return if user owns this session
    if (session && session.userId === userId) {
      return session;
    }
    return null;
  },
});

