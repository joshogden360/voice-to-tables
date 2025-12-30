import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// --- INVENTORY ---
export const getInventory = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("inventory").collect();
  },
});

export const updateInventory = mutation({
  args: {
    item: v.string(),
    quantity: v.number(),
    cost: v.optional(v.number()),
    supplier: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("inventory")
      .filter(q => q.eq(q.field("item"), args.item))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        qtyOnHand: args.quantity, 
        unitCost: args.cost ?? existing.unitCost,
        supplier: args.supplier ?? existing.supplier
      });
    } else {
      await ctx.db.insert("inventory", {
        userId: "system", // Placeholder
        item: args.item,
        qtyOnHand: args.quantity,
        unitCost: args.cost ?? 0,
        supplier: args.supplier ?? "Unknown"
      });
    }
  },
});

// --- CONTACTS ---
export const getContacts = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("contacts").collect();
  },
});

export const addContact = mutation({
  args: {
    name: v.string(),
    address: v.optional(v.string()), 
    status: v.string(), // Naughty / Nice
    giftIdea: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("contacts", {
      userId: "system",
      householdName: args.name,
      addressLine1: args.address ?? "Unknown",
      notes: `Status: ${args.status}. Gift Idea: ${args.giftIdea ?? "None"}`,
      relationshipTier: args.status // Storing Naughty/Nice in relationshipTier for now? Or notes.
    });
  },
});

// --- BUDGET ---
export const getBudget = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("annualBudget").collect();
  },
});
