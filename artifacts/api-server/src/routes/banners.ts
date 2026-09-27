import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, bannersTable } from "@workspace/db";
import { CreateBannerBody, UpdateBannerBody } from "@workspace/api-zod";
import { requireAuth, requireAdmin } from "../middleware/auth";
import { requireId } from "../lib/http";

const router: IRouter = Router();

router.get("/banners", async (_req, res): Promise<void> => {
  const banners = await db.select().from(bannersTable).where(eq(bannersTable.isActive, true));
  res.json(banners.map((b) => ({ ...b })));
});

router.post("/banners", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const parsed = CreateBannerBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [banner] = await db.insert(bannersTable).values(parsed.data).returning();
  res.status(201).json(banner);
});

router.patch("/banners/:id", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const id = requireId(req, res);
  if (id === null) return;
  const parsed = UpdateBannerBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [banner] = await db.update(bannersTable).set(parsed.data).where(eq(bannersTable.id, id)).returning();
  if (!banner) { res.status(404).json({ error: "Banner not found" }); return; }
  res.json(banner);
});

router.delete("/banners/:id", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const id = requireId(req, res);
  if (id === null) return;
  await db.delete(bannersTable).where(eq(bannersTable.id, id));
  res.sendStatus(204);
});

export default router;
