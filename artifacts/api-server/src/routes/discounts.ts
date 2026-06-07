import { Router, type IRouter } from "express";
import { eq, and, lte } from "drizzle-orm";
import { db, discountsTable } from "@workspace/db";
import { CreateDiscountBody, ValidateDiscountBody } from "@workspace/api-zod";
import { requireAuth, requireAdmin } from "../middleware/auth";

const router: IRouter = Router();

function enrichDiscount(d: typeof discountsTable.$inferSelect) {
  return { ...d, value: Number(d.value), minOrder: d.minOrder ? Number(d.minOrder) : null, expiresAt: d.expiresAt ? d.expiresAt.toISOString() : null };
}

router.post("/discounts/validate", async (req, res): Promise<void> => {
  const parsed = ValidateDiscountBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const { code, cartTotal } = parsed.data;
  const [disc] = await db.select().from(discountsTable).where(eq(discountsTable.code, code));
  if (!disc || !disc.isActive) { res.json({ valid: false, discountAmount: 0, message: "کد تخفیف نامعتبر است" }); return; }
  if (disc.expiresAt && disc.expiresAt < new Date()) { res.json({ valid: false, discountAmount: 0, message: "کد تخفیف منقضی شده است" }); return; }
  if (disc.minOrder && cartTotal < Number(disc.minOrder)) { res.json({ valid: false, discountAmount: 0, message: `حداقل خرید ${Number(disc.minOrder).toLocaleString('fa-IR')} تومان الزامی است` }); return; }
  if (disc.maxUses && disc.usedCount >= disc.maxUses) { res.json({ valid: false, discountAmount: 0, message: "ظرفیت کد تخفیف پر شده است" }); return; }
  const discountAmount = disc.type === "percent" ? cartTotal * Number(disc.value) / 100 : Number(disc.value);
  res.json({ valid: true, discount: enrichDiscount(disc), discountAmount, message: null });
});

router.get("/discounts", async (_req, res): Promise<void> => {
  const discounts = await db.select().from(discountsTable);
  res.json(discounts.map(enrichDiscount));
});

router.post("/discounts", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const parsed = CreateDiscountBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const data: Record<string, unknown> = {
    ...parsed.data,
    value: String(parsed.data.value),
    minOrder: parsed.data.minOrder != null ? String(parsed.data.minOrder) : null,
    expiresAt: parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : null,
  };
  const [disc] = await db.insert(discountsTable).values(data as Parameters<typeof db.insert>[0]["values"]).returning();
  res.status(201).json(enrichDiscount(disc));
});

router.delete("/discounts/:id", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  await db.delete(discountsTable).where(eq(discountsTable.id, id));
  res.sendStatus(204);
});

export default router;
