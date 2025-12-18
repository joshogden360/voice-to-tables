import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const upsert = mutation({
  args: {
    sessionId: v.string(),
    title: v.string(),
    columns: v.array(v.string()),
    rows: v.array(v.any()),
    summary: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    const userId = identity.subject;
    const timestamp = Date.now();
    
    const existing = await ctx.db
      .query("tables")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .unique();

    if (existing && existing.userId === userId) {
      // Only update if user owns this table (security)
      await ctx.db.patch(existing._id, {
        title: args.title,
        columns: args.columns,
        rows: args.rows,
        summary: args.summary,
        lastUpdatedAt: timestamp,
      });
    } else if (!existing) {
      // Create new table
      await ctx.db.insert("tables", {
        userId,
        sessionId: args.sessionId,
        title: args.title,
        columns: args.columns,
        rows: args.rows,
        summary: args.summary,
        createdAt: timestamp,
        lastUpdatedAt: timestamp,
      });
    }
  },
});

export const getBySession = query({
  args: { 
    sessionId: v.string() 
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }
    const userId = identity.subject;

    const table = await ctx.db
      .query("tables")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .unique();
    
    // Only return if user owns this table (data isolation)
    if (table && table.userId === userId) {
      return table;
    }
    return null;
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

    // Get all tables for a user
    return await ctx.db
      .query("tables")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(20); // Recent 20 tables
  },
});

export const addRow = mutation({
  args: {
    sessionId: v.string(),
    row: v.any(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    const userId = identity.subject;

    const table = await ctx.db
      .query("tables")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .unique();
    
    if (table && table.userId === userId) {
      // Only update if user owns this table
      await ctx.db.patch(table._id, {
        rows: [...table.rows, args.row],
        lastUpdatedAt: Date.now(),
      });
    }
  },
});

export const deleteTable = mutation({
  args: {
    sessionId: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    const userId = identity.subject;

    const table = await ctx.db
      .query("tables")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .unique();
    
    if (table && table.userId === userId) {
      await ctx.db.delete(table._id);
    }
  },
});

export const addToMaster = mutation({
  args: {
    priorExperience: v.string(),
    country: v.string(),
    languages: v.string(),
    populationIndex: v.string(),
  },
  handler: async (ctx, args) => {
    // This is an anonymous global collection
    await ctx.db.insert("masterSurvey", {
      ...args,
      timestamp: Date.now(),
    });
  },
});

export const getMasterCount = query({
  args: {},
  handler: async (ctx) => {
    const results = await ctx.db.query("masterSurvey").collect();
    return results.length;
  },
});
