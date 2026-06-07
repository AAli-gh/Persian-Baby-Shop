import type { Request, Response, NextFunction } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

type UserRow = typeof usersTable.$inferSelect;

declare global {
  namespace Express {
    interface Request {
      user?: UserRow;
    }
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers["authorization"];
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "احراز هویت الزامی است" });
    return;
  }
  const token = authHeader.slice(7);
  try {
    const decoded = Buffer.from(token, "base64").toString("utf8");
    const userId = parseInt(decoded.split(":")[0]!, 10);
    if (!userId || Number.isNaN(userId)) throw new Error("invalid token");
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
    if (!user) { res.status(401).json({ error: "کاربر یافت نشد" }); return; }
    req.user = user;
    next();
  } catch {
    res.status(401).json({ error: "توکن نامعتبر است" });
  }
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) { res.status(401).json({ error: "احراز هویت الزامی است" }); return; }
  if (req.user.role !== "admin" && req.user.role !== "manager") {
    res.status(403).json({ error: "دسترسی غیرمجاز. شما مجوز لازم را ندارید." });
    return;
  }
  next();
}

export const adminOnly = [requireAuth, requireAdmin] as const;
