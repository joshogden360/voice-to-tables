import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const populateContacts = mutation({
  args: { data: v.array(v.any()) },
  handler: async (ctx, args) => {
    for (const item of args.data) {
      await ctx.db.insert("contacts", item);
    }
  },
});

export const populateInventory = mutation({
  args: { data: v.array(v.any()) },
  handler: async (ctx, args) => {
    for (const item of args.data) {
      await ctx.db.insert("inventory", item);
    }
  },
});

export const populateSpendingHistory = mutation({
  args: { data: v.array(v.any()) },
  handler: async (ctx, args) => {
    for (const item of args.data) {
      await ctx.db.insert("spendingHistory", item);
    }
  },
});

export const populateAnnualBudget = mutation({
  args: { data: v.array(v.any()) },
  handler: async (ctx, args) => {
    for (const item of args.data) {
      await ctx.db.insert("annualBudget", item);
    }
  },
});
