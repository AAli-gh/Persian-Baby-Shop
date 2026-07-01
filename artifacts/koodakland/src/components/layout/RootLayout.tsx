import { ReactNode } from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { MobileNav } from "./MobileNav";
import { BackToTop } from "./BackToTop";
import { useLocation } from "wouter";

export function RootLayout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const isAdmin = location.startsWith("/admin");

  if (isAdmin) {
    return <div className="min-h-[100dvh] w-full" dir="rtl">{children}</div>;
  }

  return (
    <div className="min-h-[100dvh] w-full flex flex-col bg-background/50" dir="rtl">
      <Header />
      <main className="flex-1 pb-16 md:pb-0">
        {children}
      </main>
      <div className="hidden md:block">
        <Footer />
      </div>
      <MobileNav />
      <BackToTop />
    </div>
  );
}
