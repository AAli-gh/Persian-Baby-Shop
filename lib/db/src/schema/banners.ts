import { pgTable, serial, text, boolean, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const bannersTable = pgTable("banners", {
  id: serial("id").primaryKey(),
  title: text("title"),
  titleFa: text("title_fa"),
  subtitle: text("subtitle"),
  subtitleFa: text("subtitle_fa"),
  image: text("image").notNull(),
  link: text("link"),
  position: text("position").notNull().default("hero"),
  buttonText: text("button_text"),
  buttonTextFa: text("button_text_fa"),
  startsAt: timestamp("starts_at"),
  endsAt: timestamp("ends_at"),
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertBannerSchema = createInsertSchema(bannersTable).omit({ id: true, createdAt: true });
export type InsertBanner = z.infer<typeof insertBannerSchema>;
export type Banner = typeof bannersTable.$inferSelect;
