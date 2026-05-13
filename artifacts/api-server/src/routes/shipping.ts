import { Router, type IRouter } from "express";
import { db, shippingMethodsTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/shipping/methods", async (_req, res): Promise<void> => {
  const methods = await db.select().from(shippingMethodsTable);
  res.json(methods.map((m) => ({ ...m, price: Number(m.price), minOrderForFree: m.minOrderForFree ? Number(m.minOrderForFree) : null })));
});

router.get("/shipping/track/:trackingCode", async (req, res): Promise<void> => {
  const trackingCode = Array.isArray(req.params.trackingCode) ? req.params.trackingCode[0] : req.params.trackingCode;
  // Mock tracking data
  const events = [
    { timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), status: "ordered", statusFa: "سفارش ثبت شد", location: "تهران" },
    { timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), status: "processing", statusFa: "در حال پردازش", location: "انبار مرکزی" },
    { timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), status: "shipped", statusFa: "ارسال شد", location: "مرکز پست تهران" },
    { timestamp: new Date().toISOString(), status: "in_transit", statusFa: "در مسیر", location: "مرکز توزیع استان" },
  ];
  res.json({ trackingCode, status: "in_transit", statusFa: "در مسیر", carrier: "پست ایران", estimatedDelivery: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), events });
});

export default router;
