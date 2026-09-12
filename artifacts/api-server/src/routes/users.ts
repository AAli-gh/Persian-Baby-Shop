import { Router, type IRouter } from "express";
import { clerkClient } from "@clerk/express";
import { eq } from "drizzle-orm";
import { db, usersTable, addressesTable } from "@workspace/db";
import { UpdateUserBody, AddUserAddressBody } from "@workspace/api-zod";
import { requireAuth } from "../middleware/auth";

const router: IRouter = Router();

router.get("/auth/me", requireAuth, (req, res): void => {
  const user = req.user!;
  res.json({
    id: user.id,
    mobile: user.mobile,
    name: user.name,
    email: user.email,
    avatar: user.avatar,
    role: user.role,
    createdAt: user.createdAt.toISOString(),
  });
});

router.post("/auth/sign-out-all", requireAuth, async (req, res): Promise<void> => {
  const sessions = await clerkClient.sessions.getSessionList({ userId: req.clerkUserId! });
  await Promise.all(
    sessions.data
      .filter((session) => session.status === "active")
      .map((session) => clerkClient.sessions.revokeSession(session.id)),
  );
  res.json({ success: true });
});

function canAccessUser(req: Parameters<typeof requireAuth>[0], id: number): boolean {
  return req.user?.id === id || req.user?.role === "admin" || req.user?.role === "manager";
}

router.get("/users/:id", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (!canAccessUser(req, id)) { res.status(403).json({ error: "دسترسی غیرمجاز" }); return; }
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, id));
  if (!user) { res.status(404).json({ error: "User not found" }); return; }
  res.json({ id: user.id, mobile: user.mobile, name: user.name, email: user.email, avatar: user.avatar, role: user.role, createdAt: user.createdAt.toISOString() });
});

router.patch("/users/:id", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (!canAccessUser(req, id)) { res.status(403).json({ error: "دسترسی غیرمجاز" }); return; }
  const parsed = UpdateUserBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [user] = await db.update(usersTable).set(parsed.data).where(eq(usersTable.id, id)).returning();
  if (!user) { res.status(404).json({ error: "User not found" }); return; }
  res.json({ id: user.id, mobile: user.mobile, name: user.name, email: user.email, avatar: user.avatar, role: user.role, createdAt: user.createdAt.toISOString() });
});

router.get("/users/:id/addresses", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (!canAccessUser(req, id)) { res.status(403).json({ error: "دسترسی غیرمجاز" }); return; }
  const addresses = await db.select().from(addressesTable).where(eq(addressesTable.userId, id));
  res.json(addresses);
});

router.post("/users/:id/addresses", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (!canAccessUser(req, id)) { res.status(403).json({ error: "دسترسی غیرمجاز" }); return; }
  const parsed = AddUserAddressBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [address] = await db.insert(addressesTable).values({ ...parsed.data, userId: id }).returning();
  res.status(201).json(address);
});

export default router;
