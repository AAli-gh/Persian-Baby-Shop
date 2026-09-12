import { pgTable, serial, text, integer, numeric, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const ordersTable = pgTable("orders", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"),
  orderNumber: text("order_number").notNull().unique(),
  status: text("status").notNull().default("pending"),
  inventoryReserved: boolean("inventory_reserved").notNull().default(false),
  subtotal: numeric("subtotal", { precision: 12, scale: 0 }).notNull(),
  shippingCost: numeric("shipping_cost", { precision: 12, scale: 0 }).notNull().default("0"),
  discount: numeric("discount", { precision: 12, scale: 0 }).notNull().default("0"),
  total: numeric("total", { precision: 12, scale: 0 }).notNull(),
  addressSnapshot: text("address_snapshot"),
  shippingMethod: text("shipping_method"),
  trackingCode: text("tracking_code"),
  notes: text("notes"),
  customerName: text("customer_name"),
  customerPhone: text("customer_phone"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const orderItemsTable = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull(),
  productId: integer("product_id").notNull(),
  productName: text("product_name").notNull(),
  quantity: integer("quantity").notNull(),
  price: numeric("price", { precision: 12, scale: 0 }).notNull(),
  image: text("image"),
});

export const insertOrderSchema = createInsertSchema(ordersTable).omit({ id: true, createdAt: true, updatedAt: true });
export const insertOrderItemSchema = createInsertSchema(orderItemsTable).omit({ id: true });
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof ordersTable.$inferSelect;
export type OrderItem = typeof orderItemsTable.$inferSelect;
