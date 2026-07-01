import { pgTable, serial, integer, text, boolean, timestamp, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const wishlistsTable = pgTable("wishlists", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  name: text("name").notNull().default("علاقه‌مندی‌ها"),
  isDefault: boolean("is_default").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const wishlistItemsTable = pgTable("wishlist_items", {
  id: serial("id").primaryKey(),
  wishlistId: integer("wishlist_id").notNull(),
  productId: integer("product_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [unique().on(t.wishlistId, t.productId)]);

export const insertWishlistListSchema = createInsertSchema(wishlistsTable).omit({ id: true, createdAt: true });
export type InsertWishlistList = z.infer<typeof insertWishlistListSchema>;
export type WishlistList = typeof wishlistsTable.$inferSelect;

export const insertWishlistItemSchema = createInsertSchema(wishlistItemsTable).omit({ id: true, createdAt: true });
export type InsertWishlistItem = z.infer<typeof insertWishlistItemSchema>;
export type WishlistItem = typeof wishlistItemsTable.$inferSelect;
