import { pgTable, serial, text, integer, numeric, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const productsTable = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  nameFa: text("name_fa").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  descriptionFa: text("description_fa"),
  price: numeric("price", { precision: 12, scale: 0 }).notNull(),
  salePrice: numeric("sale_price", { precision: 12, scale: 0 }),
  images: jsonb("images").notNull().default([]),
  categoryId: integer("category_id").notNull(),
  stock: integer("stock").notNull().default(0),
  sku: text("sku"),
  brand: text("brand"),
  ageGroup: text("age_group"),
  weight: numeric("weight", { precision: 8, scale: 2 }),
  tags: jsonb("tags").default([]),
  gender: text("gender"),
  isFeatured: boolean("is_featured").default(false).notNull(),
  isFlashSale: boolean("is_flash_sale").default(false).notNull(),
  isBestSeller: boolean("is_best_seller").default(false).notNull(),
  flashSaleEndsAt: timestamp("flash_sale_ends_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertProductSchema = createInsertSchema(productsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof productsTable.$inferSelect;
