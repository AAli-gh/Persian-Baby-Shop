import { pgTable, serial, text, numeric, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const shippingMethodsTable = pgTable("shipping_methods", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  nameFa: text("name_fa").notNull(),
  price: numeric("price", { precision: 10, scale: 0 }).notNull().default("0"),
  estimatedDays: integer("estimated_days").notNull().default(3),
  isFree: boolean("is_free").notNull().default(false),
  minOrderForFree: numeric("min_order_for_free", { precision: 12, scale: 0 }),
});

export const insertShippingMethodSchema = createInsertSchema(shippingMethodsTable).omit({ id: true });
export type InsertShippingMethod = z.infer<typeof insertShippingMethodSchema>;
export type ShippingMethod = typeof shippingMethodsTable.$inferSelect;
