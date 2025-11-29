import { pgTable, serial, text, integer, timestamp, pgEnum } from "drizzle-orm/pg-core";

export const transactionTypeEnum = pgEnum("transaction_type", [
    "INITIAL_GRANT",
    "PURCHASE",
    "ROAST_SPEND",
]);

export const users = pgTable("users", {
    id: serial("id").primaryKey(),
    clerkId: text("clerk_id").notNull().unique(),
    email: text("email").notNull(),
    credits: integer("credits").default(0).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const transactions = pgTable("transactions", {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
        .references(() => users.id)
        .notNull(),
    amount: integer("amount").notNull(), // Positive for add, negative for spend
    type: transactionTypeEnum("type").notNull(),
    polarEventId: text("polar_event_id"), // For reference, no longer unique
    orderId: text("order_id").notNull().unique(), // Unique identifier for the purchase
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const roasts = pgTable("roasts", {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
        .references(() => users.id)
        .notNull(),
    url: text("url").notNull(),
    score: text("score").notNull(), // Storing as text to preserve formatting if needed, or use real/decimal
    tagline: text("tagline").notNull(),
    roast: text("roast").notNull(),
    shareText: text("share_text"),
    strengths: text("strengths").array(), // Using array for simplicity with Drizzle/PG
    weaknesses: text("weaknesses").array(),
    visualCrimes: text("visual_crimes").array(),
    bestPart: text("best_part"),
    worstPart: text("worst_part"),
    screenshot: text("screenshot"), // Base64 string
    modelUsed: text("model_used"),
    analysisType: text("analysis_type").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});
