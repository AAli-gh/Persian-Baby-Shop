import { pgTable, serial, text, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const smsTemplatesTable = pgTable("sms_templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  text: text("text").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const smsLogsTable = pgTable("sms_logs", {
  id: serial("id").primaryKey(),
  phone: text("phone").notNull(),
  type: text("type").notNull(),
  text: text("text").notNull(),
  // "queued" until a real SMS provider reports back; then "delivered" | "failed".
  status: text("status").notNull().default("queued"),
  providerMessageId: text("provider_message_id"),
  templateId: integer("template_id"),
  cost: integer("cost").notNull().default(0),
  sentAt: timestamp("sent_at").defaultNow().notNull(),
});

export const insertSmsTemplateSchema = createInsertSchema(smsTemplatesTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const insertSmsLogSchema = createInsertSchema(smsLogsTable).omit({ id: true, sentAt: true });
export type InsertSmsTemplate = z.infer<typeof insertSmsTemplateSchema>;
export type InsertSmsLog = z.infer<typeof insertSmsLogSchema>;
export type SmsTemplate = typeof smsTemplatesTable.$inferSelect;
export type SmsLog = typeof smsLogsTable.$inferSelect;
