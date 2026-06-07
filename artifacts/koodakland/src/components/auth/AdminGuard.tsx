import { ReactNode, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";

interface AdminGuardProps {
  children: ReactNode;
}

export function AdminGuard({ children }: AdminGuardProps) {
  const { user, token } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!token || !user) {
      navigate("/login");
      return;
    }
    if (user.role !== "admin" && user.role !== "manager") {
      navigate("/unauthorized");
    }
  }, [user, token, navigate]);

  if (!token || !user) return null;
  if (user.role !== "admin" && user.role !== "manager") return null;

  return <>{children}</>;
}
