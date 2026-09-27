import { Router, type IRouter } from "express";
import { db, newslettersTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { requireAuth, requireAdmin } from "../middleware/auth";
import { publicWriteLimiter } from "../middleware/rateLimit";
import { NewsletterSubscribeInput } from "../lib/validation";
import { requireId } from "../lib/http";
import { toCsv } from "../lib/csv";

const router: IRouter = Router();

router.post("/newsletter/subscribe", publicWriteLimiter, async (req, res): Promise<void> => {
  const parsed = NewsletterSubscribeInput.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "ایمیل معتبر نیست" }); return; }
  const { email, name, source } = parsed.data;

  const [existing] = await db
    .select()
    .from(newslettersTable)
    .where(eq(newslettersTable.email, email));

  if (existing) {
    if (!existing.isActive) {
      await db
        .update(newslettersTable)
        .set({ isActive: true })
        .where(eq(newslettersTable.id, existing.id));
      res.json({ ok: true, message: "دوباره عضو شدید!" });
      return;
    }
    res.json({ ok: true, message: "شما قبلاً عضو شده‌اید" });
    return;
  }

  const [created] = await db
    .insert(newslettersTable)
    .values({ email, name: name ?? null, source: source ?? "footer", isActive: true })
    .returning();
  res.status(201).json({ ok: true, message: "با موفقیت عضو شدید!", id: created!.id });
});

router.get("/newsletter/subscribers", requireAuth, requireAdmin, async (_req, res): Promise<void> => {
  const subs = await db.select().from(newslettersTable).orderBy(desc(newslettersTable.createdAt));
  res.json({
    subscribers: subs,
    total: subs.length,
    active: subs.filter((s) => s.isActive).length,
  });
});

router.delete(
  "/newsletter/subscribers/:id",
  requireAuth,
  requireAdmin,
  async (req, res): Promise<void> => {
    const id = requireId(req, res);
    if (id === null) return;
    await db
      .update(newslettersTable)
      .set({ isActive: false })
      .where(eq(newslettersTable.id, id));
    res.json({ ok: true });
  },
);

router.get("/newsletter/export", requireAuth, requireAdmin, async (_req, res): Promise<void> => {
  const subs = await db
    .select()
    .from(newslettersTable)
    .where(eq(newslettersTable.isActive, true))
    .orderBy(desc(newslettersTable.createdAt));

  const csv = toCsv(
    ["email", "name", "source", "date"],
    subs.map((s) => [s.email, s.name ?? "", s.source, s.createdAt.toISOString().slice(0, 10)]),
  );
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", "attachment; filename=subscribers.csv");
  res.send(csv);
});

export default router;
