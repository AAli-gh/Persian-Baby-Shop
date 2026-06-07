import { Router, type IRouter } from "express";
import { requireAuth, requireAdmin } from "../middleware/auth";

const router: IRouter = Router();
router.use(requireAuth, requireAdmin);

const SMS_TEMPLATES = [
  { id: 1, name: "کد تایید OTP", type: "otp", text: "کد تایید کودک‌لند شما: {code}\nاین کد ۵ دقیقه اعتبار دارد.", isActive: true },
  { id: 2, name: "تایید سفارش", type: "order", text: "سفارش #{orderNumber} شما با موفقیت ثبت شد.\nمبلغ: {amount} تومان\nپیگیری: koodakland.ir/track", isActive: true },
  { id: 3, name: "ارسال سفارش", type: "shipping", text: "سفارش #{orderNumber} شما ارسال شد.\nکد رهگیری: {trackingCode}\nتحویل تا {estimatedDate}", isActive: true },
  { id: 4, name: "کمپین تخفیف", type: "campaign", text: "🎁 {name} عزیز، یک هدیه ویژه داری!\nکد تخفیف {code} را در کودک‌لند استفاده کن.\nاعتبار تا {expiry}", isActive: false },
  { id: 5, name: "یادآوری سبد خرید", type: "cart", text: "{name} عزیز، سبد خرید شما منتظر است!\nتکمیل خرید: koodakland.ir/cart", isActive: true },
];

const SMS_LOGS: Array<{
  id: number; phone: string; type: string; text: string;
  status: "delivered" | "failed" | "pending"; sentAt: string; cost: number;
}> = [
  { id: 1, phone: "09121234567", type: "otp", text: "کد تایید: ۱۲۳۴۵۶", status: "delivered", sentAt: new Date(Date.now() - 3600000).toISOString(), cost: 25 },
  { id: 2, phone: "09351234567", type: "order", text: "سفارش #1001 ثبت شد", status: "delivered", sentAt: new Date(Date.now() - 7200000).toISOString(), cost: 25 },
  { id: 3, phone: "09181234567", type: "shipping", text: "سفارش شما ارسال شد", status: "delivered", sentAt: new Date(Date.now() - 86400000).toISOString(), cost: 25 },
  { id: 4, phone: "09011234567", type: "campaign", text: "کد تخفیف KOODAK20", status: "failed", sentAt: new Date(Date.now() - 172800000).toISOString(), cost: 0 },
  { id: 5, phone: "09121111111", type: "otp", text: "کد تایید: ۶۵۴۳۲۱", status: "pending", sentAt: new Date(Date.now() - 300000).toISOString(), cost: 25 },
];

let templateList = [...SMS_TEMPLATES];
let logList = [...SMS_LOGS];
let nextLogId = 10;

router.get("/sms/stats", (_req, res) => {
  const delivered = logList.filter(l => l.status === "delivered").length;
  const failed = logList.filter(l => l.status === "failed").length;
  const total = logList.length;
  const totalCost = logList.reduce((a, b) => a + b.cost, 0);
  res.json({
    totalSent: total,
    delivered,
    failed,
    pending: logList.filter(l => l.status === "pending").length,
    deliveryRate: total > 0 ? Math.round((delivered / total) * 100) : 0,
    totalCost,
    credit: 5000,
  });
});

router.get("/sms/templates", (_req, res) => {
  res.json(templateList);
});

router.post("/sms/templates", (req, res) => {
  const { name, type, text } = req.body as { name: string; type: string; text: string };
  const tmpl = { id: Date.now(), name, type, text, isActive: true };
  templateList.push(tmpl);
  res.status(201).json(tmpl);
});

router.patch("/sms/templates/:id", (req, res): void => {
  const id = parseInt(req.params["id"] ?? "0", 10);
  const idx = templateList.findIndex(t => t.id === id);
  if (idx === -1) { res.status(404).json({ error: "Not found" }); return; }
  templateList[idx] = { ...templateList[idx], ...req.body };
  res.json(templateList[idx]);
});

router.get("/sms/logs", (req, res) => {
  const page = parseInt(String(req.query["page"] ?? "1"), 10);
  const limit = parseInt(String(req.query["limit"] ?? "20"), 10);
  const type = req.query["type"] as string | undefined;
  let filtered = logList;
  if (type && type !== "all") filtered = filtered.filter(l => l.type === type);
  const total = filtered.length;
  const items = filtered.slice((page - 1) * limit, page * limit);
  res.json({ logs: items, total, page, pages: Math.ceil(total / limit) });
});

router.post("/sms/send", (req, res) => {
  const { phones, templateId, variables } = req.body as {
    phones: string[];
    templateId: number;
    variables?: Record<string, string>;
  };
  const template = templateList.find(t => t.id === templateId);
  if (!template) { res.status(404).json({ error: "Template not found" }); return; }
  let text = template.text;
  if (variables) {
    Object.entries(variables).forEach(([k, v]) => {
      text = text.replace(new RegExp(`\\{${k}\\}`, "g"), v);
    });
  }
  const newLogs = phones.map(phone => ({
    id: nextLogId++,
    phone,
    type: template.type,
    text,
    status: Math.random() > 0.1 ? "delivered" as const : "failed" as const,
    sentAt: new Date().toISOString(),
    cost: 25,
  }));
  logList = [...newLogs, ...logList];
  res.json({ sent: newLogs.length, logs: newLogs });
});

export default router;
