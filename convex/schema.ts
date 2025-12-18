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
  })
    .index("by_timestamp", ["timestamp"]),
});
