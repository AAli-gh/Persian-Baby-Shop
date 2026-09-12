import { ReactNode, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";

interface AdminGuardProps {
  children: ReactNode;
}

export function AdminGuard({ children }: AdminGuardProps) {
  const { user, isLoaded } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!isLoaded) return;
    if (!user) {
      navigate("/login");
      return;
    }
    if (user.role !== "admin" && user.role !== "manager") {
      navigate("/unauthorized");
    }
  }, [user, isLoaded, navigate]);

  if (!isLoaded || !user) return null;
  if (user.role !== "admin" && user.role !== "manager") return null;

  return <>{children}</>;
}
