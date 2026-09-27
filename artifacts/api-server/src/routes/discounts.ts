import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, discountsTable } from "@workspace/db";
import { CreateDiscountBody, ValidateDiscountBody } from "@workspace/api-zod";
import { requireAuth, requireAdmin } from "../middleware/auth";
import { evaluateDiscount, serializeDiscount } from "../lib/discount";
import { guessableLimiter } from "../middleware/rateLimit";
import { requireId } from "../lib/http";

const router: IRouter = Router();

/**
 * Quotes a discount for a cart. Rate limited because an unauthenticated caller
 * could otherwise use it to enumerate valid codes.
 */
router.post("/discounts/validate", guessableLimiter, async (req, res): Promise<void> => {
  const parsed = ValidateDiscountBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const { code, cartTotal } = parsed.data;

  const [row] = await db.select().from(discountsTable).where(eq(discountsTable.code, code));
  const evaluation = evaluateDiscount(row, cartTotal);

  if (!evaluation.valid) {
    res.json({ valid: false, discountAmount: 0, message: evaluation.message });
    return;
  }

  res.json({
    valid: true,
    discount: serializeDiscount(evaluation.discount),
    discountAmount: evaluation.amount,
    message: null,
  });
});

// Admin-only: the full list is the set of live codes, which must not be public.
router.get("/discounts", requireAuth, requireAdmin, async (_req, res): Promise<void> => {
  const discounts = await db.select().from(discountsTable);
  res.json(discounts.map(serializeDiscount));
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
  const [disc] = await db
    .insert(discountsTable)
    .values(data as typeof discountsTable.$inferInsert)
    .returning();
  res.status(201).json(serializeDiscount(disc!));
});

router.delete("/discounts/:id", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const id = requireId(req, res);
  if (id === null) return;
  await db.delete(discountsTable).where(eq(discountsTable.id, id));
  res.sendStatus(204);
});

export default router;
