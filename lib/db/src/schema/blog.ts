import { pgTable, serial, text, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const blogCategoriesTable = pgTable("blog_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  nameFa: text("name_fa").notNull(),
  slug: text("slug").notNull().unique(),
});

export const blogPostsTable = pgTable("blog_posts", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  titleFa: text("title_fa").notNull(),
  excerpt: text("excerpt"),
  excerptFa: text("excerpt_fa"),
  content: text("content").notNull(),
  contentFa: text("content_fa").notNull(),
  coverImage: text("cover_image"),
  categoryId: integer("category_id"),
  authorName: text("author_name").notNull(),
  tags: jsonb("tags").default([]),
  isPublished: boolean("is_published").notNull().default(false),
  readingTime: integer("reading_time").notNull().default(5),
  viewCount: integer("view_count").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertBlogPostSchema = createInsertSchema(blogPostsTable).omit({ id: true, createdAt: true, updatedAt: true });
export const insertBlogCategorySchema = createInsertSchema(blogCategoriesTable).omit({ id: true });
export type InsertBlogPost = z.infer<typeof insertBlogPostSchema>;
export type BlogPost = typeof blogPostsTable.$inferSelect;
export type BlogCategory = typeof blogCategoriesTable.$inferSelect;
