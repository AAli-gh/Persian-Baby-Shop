import { ReactNode, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { Skeleton } from "@/components/ui/skeleton";

interface AdminGuardProps {
  children: ReactNode;
}

function isStaff(role: string | undefined): boolean {
  return role === "admin" || role === "manager";
}

/**
 * Keeps the admin screens from mounting for anyone but staff.
 *
 * This is presentation only — every `/api/admin/*` route enforces the same rule
 * server-side. Its job here is to make sure no admin page (and therefore none of
 * their queries) is ever mounted for a visitor who would be refused anyway.
 */
export function AdminGuard({ children }: AdminGuardProps) {
  const { user, isLoaded } = useAuth();
  const [, navigate] = useLocation();

  const allowed = isStaff(user?.role);

  useEffect(() => {
    if (!isLoaded) return;
    if (!user) {
      navigate("/login");
      return;
    }
    if (!allowed) navigate("/unauthorized");
  }, [user, isLoaded, allowed, navigate]);

  if (!isLoaded) {
    return (
      <div className="container mx-auto flex flex-col gap-4 px-4 py-8" dir="rtl">
        <Skeleton className="h-10 w-48 rounded-xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (!user || !allowed) return null;

  return <>{children}</>;
}
