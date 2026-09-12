import type { Request, Response, NextFunction } from "express";
import { clerkClient, getAuth } from "@clerk/express";
import { db, usersTable } from "@workspace/db";
import { and, eq } from "drizzle-orm";

type UserRow = typeof usersTable.$inferSelect;

declare global {
  namespace Express {
    interface Request {
      user?: UserRow;
      clerkUserId?: string;
    }
  }
}

async function syncLocalUser(
  clerkUserId: string,
): Promise<UserRow> {
  const [existing] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.clerkId, clerkUserId));
  if (existing) return existing;

  const clerkUser = await clerkClient.users.getUser(clerkUserId);
  const email =
    clerkUser.primaryEmailAddress?.emailAddress ??
    clerkUser.emailAddresses[0]?.emailAddress ??
    null;
  const mobile =
    clerkUser.primaryPhoneNumber?.phoneNumber ??
    clerkUser.phoneNumbers[0]?.phoneNumber ??
    `clerk:${clerkUserId}`;

  // Attach an existing local account when its email matches the Clerk account.
  // This preserves admin/manager roles during the one-time migration.
  if (email) {
    const [legacy] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email));
    if (legacy) {
      const [linked] = await db
        .update(usersTable)
        .set({
          clerkId: clerkUserId,
          name: legacy.name ?? clerkUser.firstName ?? null,
          avatar: legacy.avatar ?? clerkUser.imageUrl ?? null,
        })
        .where(eq(usersTable.id, legacy.id))
        .returning();
      return linked;
    }
  }

  const [created] = await db
    .insert(usersTable)
    .values({
      clerkId: clerkUserId,
      mobile,
      email,
      name: clerkUser.firstName
        ? `${clerkUser.firstName}${clerkUser.lastName ? ` ${clerkUser.lastName}` : ""}`
        : null,
      avatar: clerkUser.imageUrl ?? null,
    })
    .returning();
  return created;
}

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const auth = getAuth(req);
  if (!auth.userId) {
    res.status(401).json({ error: "احراز هویت الزامی است" });
    return;
  }

  try {
    req.clerkUserId = auth.userId;
    req.user = await syncLocalUser(auth.userId);
    next();
  } catch {
    res.status(401).json({ error: "نشست کاربر معتبر نیست" });
  }
}

export async function optionalAuth(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  const auth = getAuth(req);
  if (!auth.userId) {
    next();
    return;
  }

  try {
    req.clerkUserId = auth.userId;
    req.user = await syncLocalUser(auth.userId);
  } catch {
    // A public endpoint remains usable as a guest if account synchronization
    // is temporarily unavailable. It must never trust client-supplied user IDs.
  }
  next();
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
