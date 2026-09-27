import { Router, type IRouter } from "express";
import { and, desc, eq, sql } from "drizzle-orm";
import { db, smsTemplatesTable, smsLogsTable } from "@workspace/db";
import { requireAuth, requireAdmin } from "../middleware/auth";
import { SmsSendInput, SmsTemplateInput, SmsTemplateUpdateInput } from "../lib/validation";
import { parsePaging, requireId } from "../lib/http";
import { getSmsProvider, SmsProviderNotConfiguredError } from "../lib/sms-provider";

const router: IRouter = Router();
// Scoped to this router's own prefix: an unscoped `router.use` guard would
// also run for every router mounted after this one.
router.use("/sms", requireAuth, requireAdmin);

/** Seeded into an empty `sms_templates` table so the panel starts usable. */
const DEFAULT_TEMPLATES = [
  { name: "کد تایید OTP", type: "otp", text: "کد تایید کودک‌لند شما: {code}\nاین کد ۵ دقیقه اعتبار دارد.", isActive: true },
  { name: "تایید سفارش", type: "order", text: "سفارش #{orderNumber} شما با موفقیت ثبت شد.\nمبلغ: {amount} تومان\nپیگیری: koodakland.ir/track", isActive: true },
  { name: "ارسال سفارش", type: "shipping", text: "سفارش #{orderNumber} شما ارسال شد.\nکد رهگیری: {trackingCode}\nتحویل تا {estimatedDate}", isActive: true },
  { name: "کمپین تخفیف", type: "campaign", text: "🎁 {name} عزیز، یک هدیه ویژه داری!\nکد تخفیف {code} را در کودک‌لند استفاده کن.\nاعتبار تا {expiry}", isActive: false },
  { name: "یادآوری سبد خرید", type: "cart", text: "{name} عزیز، سبد خرید شما منتظر است!\nتکمیل خرید: koodakland.ir/cart", isActive: true },
];

async function listTemplates() {
  const templates = await db.select().from(smsTemplatesTable).orderBy(smsTemplatesTable.id);
  if (templates.length > 0) return templates;
  return db.insert(smsTemplatesTable).values(DEFAULT_TEMPLATES).returning();
}

function renderTemplate(text: string, variables: Record<string, string> | undefined): string {
  if (!variables) return text;
  return Object.entries(variables).reduce(
    (rendered, [key, value]) => rendered.split(`{${key}}`).join(value),
    text,
  );
}

router.get("/sms/stats", async (_req, res): Promise<void> => {
  const [row] = await db
    .select({
      total: sql<string>`count(*)`,
      delivered: sql<string>`count(*) filter (where ${smsLogsTable.status} = 'delivered')`,
      failed: sql<string>`count(*) filter (where ${smsLogsTable.status} = 'failed')`,
      queued: sql<string>`count(*) filter (where ${smsLogsTable.status} = 'queued')`,
      totalCost: sql<string>`coalesce(sum(${smsLogsTable.cost}), 0)`,
    })
    .from(smsLogsTable);

  const total = Number(row?.total ?? 0);
  const delivered = Number(row?.delivered ?? 0);

  res.json({
    totalSent: total,
    delivered,
    failed: Number(row?.failed ?? 0),
    pending: Number(row?.queued ?? 0),
    deliveryRate: total > 0 ? Math.round((delivered / total) * 100) : 0,
    totalCost: Number(row?.totalCost ?? 0),
    // Only a live provider can report the remaining credit.
    credit: null,
    providerConfigured: getSmsProvider() !== null,
  });
});

router.get("/sms/templates", async (_req, res): Promise<void> => {
  res.json(await listTemplates());
});

router.post("/sms/templates", async (req, res): Promise<void> => {
  const parsed = SmsTemplateInput.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [template] = await db.insert(smsTemplatesTable).values(parsed.data).returning();
  res.status(201).json(template);
});

router.patch("/sms/templates/:id", async (req, res): Promise<void> => {
  const id = requireId(req, res);
  if (id === null) return;
  const parsed = SmsTemplateUpdateInput.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const [template] = await db
    .update(smsTemplatesTable)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(smsTemplatesTable.id, id))
    .returning();
  if (!template) { res.status(404).json({ error: "قالب یافت نشد" }); return; }
  res.json(template);
});

router.get("/sms/logs", async (req, res): Promise<void> => {
  const { page, limit, offset } = parsePaging(req.query["page"], req.query["limit"]);
  const type = typeof req.query["type"] === "string" ? req.query["type"] : undefined;
  const where = type && type !== "all" ? eq(smsLogsTable.type, type) : undefined;

  const [{ count }] = await db
    .select({ count: sql<string>`count(*)` })
    .from(smsLogsTable)
    .where(where);
  const logs = await db
    .select()
    .from(smsLogsTable)
    .where(where)
    .orderBy(desc(smsLogsTable.sentAt))
    .limit(limit)
    .offset(offset);

  const total = Number(count);
  res.json({
    logs: logs.map((log) => ({ ...log, sentAt: log.sentAt.toISOString() })),
    total,
    page,
    pages: Math.ceil(total / limit),
  });
});

/**
 * Sends a rendered template to a list of numbers. Every message that leaves the
 * system is written to `sms_logs` with the id the provider returned, so the
 * admin report reflects real deliveries rather than a simulation.
 */
router.post("/sms/send", async (req, res): Promise<void> => {
  const parsed = SmsSendInput.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const provider = getSmsProvider();
  if (!provider) {
    const error = new SmsProviderNotConfiguredError();
    res.status(error.status).json({ error: error.message });
    return;
  }

  const [template] = await db
    .select()
    .from(smsTemplatesTable)
    .where(
      and(eq(smsTemplatesTable.id, parsed.data.templateId), eq(smsTemplatesTable.isActive, true)),
    );
  if (!template) { res.status(404).json({ error: "قالب فعالی با این شناسه یافت نشد" }); return; }

  const text = renderTemplate(template.text, parsed.data.variables);
  const phones = [...new Set(parsed.data.phones)];

  const rows = await Promise.all(
    phones.map(async (phone) => {
      try {
        const { providerMessageId } = await provider.send(phone, text);
        return {
          phone,
          type: template.type,
          text,
          status: "delivered" as const,
          providerMessageId,
          templateId: template.id,
          cost: provider.costPerMessage,
        };
      } catch (error) {
        req.log.error({ err: error, phone }, "sms delivery failed");
        return {
          phone,
          type: template.type,
          text,
          status: "failed" as const,
          providerMessageId: null,
          templateId: template.id,
          cost: 0,
        };
      }
    }),
  );

  const logs = await db.insert(smsLogsTable).values(rows).returning();
  const sent = logs.filter((log) => log.status === "delivered").length;

  res.json({
    sent,
    failed: logs.length - sent,
    logs: logs.map((log) => ({ ...log, sentAt: log.sentAt.toISOString() })),
  });
});

export default router;
