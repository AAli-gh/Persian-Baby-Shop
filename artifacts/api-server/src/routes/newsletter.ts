import { Router, type IRouter } from "express";
import { db, newslettersTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { requireAuth, requireAdmin } from "../middleware/auth";

const router: IRouter = Router();

router.post("/newsletter/subscribe", async (req, res): Promise<void> => {
  const { email, name, source } = req.body as { email: string; name?: string; source?: string };
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    res.status(400).json({ error: "ایمیل معتبر نیست" });
    return;
  }
  try {
    const [existing] = await db.select().from(newslettersTable).where(eq(newslettersTable.email, email.toLowerCase()));
    if (existing) {
      if (!existing.isActive) {
        await db.update(newslettersTable).set({ isActive: true }).where(eq(newslettersTable.id, existing.id));
        res.json({ ok: true, message: "دوباره عضو شدید!" });
      } else {
        res.json({ ok: true, message: "شما قبلاً عضو شده‌اید" });
      }
      return;
    }
    const [created] = await db.insert(newslettersTable).values({
      email: email.toLowerCase(),
      name: name || null,
      source: source || "footer",
      isActive: true,
    }).returning();
    res.status(201).json({ ok: true, message: "با موفقیت عضو شدید!", id: created.id });
  } catch (err) {
    res.status(500).json({ error: "خطای سرور" });
  }
});

router.get("/newsletter/subscribers", requireAuth, requireAdmin, async (req, res) => {
  const subs = await db.select().from(newslettersTable).orderBy(desc(newslettersTable.createdAt));
  res.json({ subscribers: subs, total: subs.length, active: subs.filter(s => s.isActive).length });
});

router.delete("/newsletter/subscribers/:id", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const id = parseInt(String(req.params["id"] ?? "0"), 10);
  await db.update(newslettersTable).set({ isActive: false }).where(eq(newslettersTable.id, id));
  res.json({ ok: true });
});

router.get("/newsletter/export", requireAuth, requireAdmin, async (_req, res) => {
  const subs = await db.select().from(newslettersTable).where(eq(newslettersTable.isActive, true)).orderBy(desc(newslettersTable.createdAt));
  const csv = ["email,name,source,date", ...subs.map(s => `${s.email},${s.name || ""},${s.source},${s.createdAt.toISOString().slice(0, 10)}`)].join("\n");
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", "attachment; filename=subscribers.csv");
  res.send(csv);
});

export default router;
