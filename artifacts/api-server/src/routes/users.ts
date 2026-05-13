import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable, addressesTable } from "@workspace/db";
import { RegisterUserBody, LoginUserBody, SendOtpBody, UpdateUserBody, AddUserAddressBody } from "@workspace/api-zod";

const router: IRouter = Router();

router.post("/auth/send-otp", async (req, res): Promise<void> => {
  const parsed = SendOtpBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
  let [user] = await db.select().from(usersTable).where(eq(usersTable.mobile, parsed.data.mobile));
  if (!user) {
    [user] = await db.insert(usersTable).values({ mobile: parsed.data.mobile, otpCode: otp, otpExpiresAt: expiresAt }).returning();
  } else {
    await db.update(usersTable).set({ otpCode: otp, otpExpiresAt: expiresAt }).where(eq(usersTable.id, user.id));
  }
  res.json({ success: true, message: "کد تایید ارسال شد", otp });
});

router.post("/auth/login", async (req, res): Promise<void> => {
  const parsed = LoginUserBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [user] = await db.select().from(usersTable).where(eq(usersTable.mobile, parsed.data.mobile));
  if (!user) { res.status(404).json({ error: "کاربر یافت نشد" }); return; }
  if (user.otpCode !== parsed.data.otp) { res.status(401).json({ error: "کد تایید نامعتبر است" }); return; }
  await db.update(usersTable).set({ otpCode: null, otpExpiresAt: null }).where(eq(usersTable.id, user.id));
  const token = Buffer.from(`${user.id}:${Date.now()}`).toString("base64");
  res.json({ token, user: { id: user.id, mobile: user.mobile, name: user.name, email: user.email, avatar: user.avatar, role: user.role, createdAt: user.createdAt.toISOString() } });
});

router.post("/auth/register", async (req, res): Promise<void> => {
  const parsed = RegisterUserBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  let [user] = await db.select().from(usersTable).where(eq(usersTable.mobile, parsed.data.mobile));
  if (!user) {
    [user] = await db.insert(usersTable).values({ mobile: parsed.data.mobile, name: parsed.data.name }).returning();
  }
  const token = Buffer.from(`${user.id}:${Date.now()}`).toString("base64");
  res.status(201).json({ token, user: { id: user.id, mobile: user.mobile, name: user.name, email: user.email, avatar: user.avatar, role: user.role, createdAt: user.createdAt.toISOString() } });
});

router.get("/users/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, id));
  if (!user) { res.status(404).json({ error: "User not found" }); return; }
  res.json({ id: user.id, mobile: user.mobile, name: user.name, email: user.email, avatar: user.avatar, role: user.role, createdAt: user.createdAt.toISOString() });
});

router.patch("/users/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const parsed = UpdateUserBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [user] = await db.update(usersTable).set(parsed.data).where(eq(usersTable.id, id)).returning();
  if (!user) { res.status(404).json({ error: "User not found" }); return; }
  res.json({ id: user.id, mobile: user.mobile, name: user.name, email: user.email, avatar: user.avatar, role: user.role, createdAt: user.createdAt.toISOString() });
});

router.get("/users/:id/addresses", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const addresses = await db.select().from(addressesTable).where(eq(addressesTable.userId, id));
  res.json(addresses);
});

router.post("/users/:id/addresses", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const parsed = AddUserAddressBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [address] = await db.insert(addressesTable).values({ ...parsed.data, userId: id }).returning();
  res.status(201).json(address);
});

export default router;
