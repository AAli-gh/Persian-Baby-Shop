import { pgTable, serial, integer, text, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const stockNotificationsTable = pgTable("stock_notifications", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull(),
  email: text("email").notNull(),
  isNotified: boolean("is_notified").notNull().default(false),
  notifiedAt: timestamp("notified_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertStockNotificationSchema = createInsertSchema(stockNotificationsTable).omit({ id: true, createdAt: true, isNotified: true, notifiedAt: true });
export type InsertStockNotification = z.infer<typeof insertStockNotificationSchema>;
export type StockNotification = typeof stockNotificationsTable.$inferSelect;
