import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // User sessions - track active sessions per user
  sessions: defineTable({
    userId: v.string(), // Clerk user ID
    sessionId: v.string(), // Unique session identifier
    platform: v.string(), // 'web', 'ios', 'android'
    templateId: v.string(), // Active template for this session
    createdAt: v.number(),
    lastActiveAt: v.number(),
    isActive: v.boolean(),
  })
    .index("by_user", ["userId", "lastActiveAt"])
    .index("by_session", ["sessionId"]),
  
  // Messages - now linked to both user and session
  messages: defineTable({
    userId: v.string(), // Clerk user ID (for data isolation)
    sessionId: v.string(),
    role: v.string(), // 'user', 'assistant', 'system'
    content: v.string(),
    timestamp: v.number(),
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
  })
    .index("by_user", ["userId", "timestamp"])
    .index("by_session", ["sessionId", "timestamp"])
    .index("by_user_session", ["userId", "sessionId", "timestamp"]),
  
  // Tables - track the most recent table for each session
  tables: defineTable({
    userId: v.string(), // Clerk user ID (for data isolation)
    sessionId: v.string(),
    title: v.string(),
    columns: v.array(v.string()),
    rows: v.array(v.any()),
    summary: v.optional(v.string()),
    createdAt: v.number(),
    lastUpdatedAt: v.number(),
  })
    .index("by_user", ["userId", "lastUpdatedAt"])
    .index("by_session", ["sessionId"])
    .index("by_user_session", ["userId", "sessionId"]),
  
  // User preferences and settings
  userPreferences: defineTable({
    userId: v.string(),
    defaultTemplateId: v.optional(v.string()),
    theme: v.optional(v.string()),
    snowIntensity: v.optional(v.number()),
    notificationsEnabled: v.optional(v.boolean()),
    lastUpdatedAt: v.number(),
  })
    .index("by_user", ["userId"]),
  
  // Master Anonymous Survey - Aggregated results for the 12/25 Demo
  masterSurvey: defineTable({
    priorExperience: v.string(),
    country: v.string(),
    languages: v.string(),
    populationIndex: v.string(), // e.g., "1 of 8,245,678,901"
    timestamp: v.number(),
    userId: v.optional(v.string()), // Optional for tracking own entry
  })
    .index("by_timestamp", ["timestamp"]),

  // Santa Factory Data Layers
  contacts: defineTable({
    userId: v.string(),
    householdName: v.optional(v.string()),
    individualNames: v.optional(v.string()),
    relationship: v.optional(v.string()),
    relationshipTier: v.optional(v.string()),
    addressLine1: v.optional(v.string()),
    addressLine2: v.optional(v.string()),
    city: v.optional(v.string()),
    state: v.optional(v.string()),
    zip: v.optional(v.string()),
    country: v.optional(v.string()),
    addressStatus: v.optional(v.string()), // 'Verified', 'Needs Lookup'
    primaryPhone: v.optional(v.string()),
    secondaryPhone: v.optional(v.string()),
    primaryEmail: v.optional(v.string()),
    secondaryEmail: v.optional(v.string()),
    instagram: v.optional(v.string()),
    facebook: v.optional(v.string()),
    linkedIn: v.optional(v.string()),
    twitter: v.optional(v.string()),
    otherSocial: v.optional(v.string()),
    preferredContact: v.optional(v.string()),
    yearAdded: v.optional(v.string()),
    cardTypePref: v.optional(v.string()),
    sent2024: v.optional(v.string()),
    response2024: v.optional(v.string()),
    giftExchange: v.optional(v.string()),
    giftOccasion: v.optional(v.string()),
    giftBudgetTier: v.optional(v.string()),
    giftGiven2024: v.optional(v.string()),
    giftValue2024: v.optional(v.number()),
    giftReceived2024: v.optional(v.string()),
    giftRecvValue2024: v.optional(v.number()),
    giftNotes: v.optional(v.string()),
    birthdays: v.optional(v.string()),
    anniversary: v.optional(v.string()),
    kidsPets: v.optional(v.string()),
    notes: v.optional(v.string()),
    lastContactDate: v.optional(v.string()),
    annualTouchpointsTarget: v.optional(v.number()),
    touchpoints2024: v.optional(v.number()),
    reciprocity: v.optional(v.string()),
    relationshipTrend: v.optional(v.string()),
  })
    .index("by_user", ["userId"]),

  inventory: defineTable({
    userId: v.string(),
    item: v.string(),
    category: v.optional(v.string()),
    qtyOnHand: v.optional(v.number()),
    reorderPoint: v.optional(v.number()),
    unitCost: v.optional(v.number()),
    totalValue: v.optional(v.number()),
    supplier: v.optional(v.string()),
    lastOrdered: v.optional(v.string()),
    notes: v.optional(v.string()),
  })
    .index("by_user", ["userId"]),

  spendingHistory: defineTable({
    userId: v.string(),
    year: v.number(),
    cardsSent: v.optional(v.number()),
    cardCost: v.optional(v.number()),
    giftsGiven: v.optional(v.number()),
    giftSpend: v.optional(v.number()),
    giftsReceived: v.optional(v.number()),
    estValueReceived: v.optional(v.number()),
    netFlow: v.optional(v.number()),
    totalSpend: v.optional(v.number()),
    notes: v.optional(v.string()),
  })
    .index("by_user", ["userId"]),

  annualBudget: defineTable({
    userId: v.string(),
    item: v.string(), // e.g., "Total", "Allocated"
    value: v.number(),
    notes: v.optional(v.string()),
  })
    .index("by_user", ["userId"]),
});
