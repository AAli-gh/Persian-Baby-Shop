import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useClerk, useUser } from "@clerk/react";
import { User } from "@workspace/api-client-react";

interface AuthContextType {
  user: User | null;
  token: string | null;
  logout: () => void;
  logoutAll: () => Promise<void>;
  updateUser: (user: User) => void;
  isLoaded: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { user: clerkUser, isLoaded: clerkLoaded } = useUser();
  const { signOut } = useClerk();
  const [user, setUser] = useState<User | null>(null);
  const [localLoaded, setLocalLoaded] = useState(false);

  useEffect(() => {
    if (!clerkLoaded) return;
    if (!clerkUser) {
      setUser(null);
      setLocalLoaded(true);
      return;
    }

    let cancelled = false;
    setLocalLoaded(false);
    fetch("/api/auth/me", { credentials: "include" })
      .then(async (response) => {
        if (!response.ok) throw new Error("Unable to load account");
        return (await response.json()) as User;
      })
      .then((localUser) => {
        if (!cancelled) setUser(localUser);
      })
      .catch(() => {
        if (!cancelled) setUser(null);
      })
      .finally(() => {
        if (!cancelled) setLocalLoaded(true);
      });

    return () => {
      cancelled = true;
    };
  }, [clerkLoaded, clerkUser]);

  const logout = () => {
    setUser(null);
    void signOut({ redirectUrl: "/" });
  };

  const logoutAll = async () => {
    const response = await fetch("/api/auth/sign-out-all", {
      method: "POST",
      credentials: "include",
    });
    if (!response.ok) throw new Error("Unable to sign out all sessions");
    setUser(null);
    await signOut({ redirectUrl: "/" });
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
  };

  return <AuthContext.Provider value={{ user, token: null, logout, logoutAll, updateUser, isLoaded: clerkLoaded && localLoaded }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
