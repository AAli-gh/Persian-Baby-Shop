import { Router, type IRouter } from "express";
import { db, stockNotificationsTable, productsTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { requireAuth, requireAdmin } from "../middleware/auth";
import { z } from "zod";

const router: IRouter = Router();

const SubscribeBody = z.object({ email: z.string().email() });

router.post("/products/:id/notify", async (req, res): Promise<void> => {
  const productId = parseInt(req.params["id"] ?? "0", 10);
  const parsed = SubscribeBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "ایمیل معتبر وارد کنید" }); return; }

  const [product] = await db.select({ id: productsTable.id, stock: productsTable.stock })
    .from(productsTable).where(eq(productsTable.id, productId));
  if (!product) { res.status(404).json({ error: "محصول یافت نشد" }); return; }
  if (product.stock > 0) { res.status(400).json({ error: "این محصول در حال حاضر موجود است" }); return; }

  const existing = await db.select().from(stockNotificationsTable)
    .where(and(eq(stockNotificationsTable.productId, productId), eq(stockNotificationsTable.email, parsed.data.email)));
  if (existing.length > 0) { res.json({ success: true, message: "شما قبلاً ثبت نام کرده‌اید" }); return; }

  await db.insert(stockNotificationsTable).values({ productId, email: parsed.data.email });
  res.json({ success: true, message: "وقتی موجود شد به شما اطلاع می‌دهیم" });
});

router.get("/admin/stock-notifications", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const productId = req.query["productId"] ? parseInt(String(req.query["productId"]), 10) : undefined;

  let notifs;
  if (productId) {
    notifs = await db.select().from(stockNotificationsTable)
      .where(eq(stockNotificationsTable.productId, productId))
      .orderBy(desc(stockNotificationsTable.createdAt));
  } else {
    notifs = await db.select().from(stockNotificationsTable)
      .orderBy(desc(stockNotificationsTable.createdAt));
  }

  const products = await db.select({ id: productsTable.id, nameFa: productsTable.nameFa, stock: productsTable.stock })
    .from(productsTable);
  const productMap = new Map(products.map(p => [p.id, p]));

  const enriched = notifs.map(n => ({
    ...n,
    createdAt: n.createdAt.toISOString(),
    notifiedAt: n.notifiedAt ? n.notifiedAt.toISOString() : null,
    productName: productMap.get(n.productId)?.nameFa ?? "ناشناخته",
    productStock: productMap.get(n.productId)?.stock ?? 0,
  }));

  const byProduct = products.map(p => ({
    productId: p.id,
    productName: p.nameFa,
    stock: p.stock,
    subscriberCount: notifs.filter(n => n.productId === p.id && !n.isNotified).length,
  })).filter(p => p.subscriberCount > 0);

  res.json({ notifications: enriched, byProduct, total: notifs.length, pending: notifs.filter(n => !n.isNotified).length });
});

router.delete("/admin/stock-notifications/:id", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const id = parseInt(String(req.params["id"] ?? "0"), 10);
  await db.delete(stockNotificationsTable).where(eq(stockNotificationsTable.id, id));
  res.sendStatus(204);
});

router.get("/admin/stock-notifications/export", requireAuth, requireAdmin, async (_req, res): Promise<void> => {
  const notifs = await db.select().from(stockNotificationsTable).orderBy(desc(stockNotificationsTable.createdAt));
  const products = await db.select({ id: productsTable.id, nameFa: productsTable.nameFa }).from(productsTable);
  const productMap = new Map(products.map(p => [p.id, p.nameFa]));
  const csv = [
    "product_id,product_name,email,is_notified,created_at",
    ...notifs.map(n => `${n.productId},${productMap.get(n.productId) ?? ""},${n.email},${n.isNotified},${n.createdAt.toISOString()}`),
  ].join("\n");
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", "attachment; filename=stock-notifications.csv");
  res.send(csv);
});

export default router;
