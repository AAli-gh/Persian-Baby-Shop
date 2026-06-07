import { Link } from "wouter";
import { ShieldX, Home, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";

export default function Unauthorized() {
  const { user } = useAuth();

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4" dir="rtl">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 rounded-3xl bg-red-50 border border-red-100 flex items-center justify-center mx-auto mb-6">
          <ShieldX className="w-10 h-10 text-red-400" />
        </div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 border border-red-100 mb-4">
          <span className="text-xs font-bold text-red-500">خطا ۴۰۳</span>
        </div>
        <h1 className="text-2xl font-black text-foreground mb-3">دسترسی ممنوع</h1>
        <p className="text-muted-foreground text-sm leading-relaxed mb-8">
          شما دسترسی لازم برای مشاهده این بخش را ندارید.
          <br />
          این صفحه فقط برای مدیران سایت قابل دسترس است.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/">
            <Button className="w-full sm:w-auto rounded-xl gap-2 font-bold">
              <Home className="w-4 h-4" />
              بازگشت به خانه
            </Button>
          </Link>
          <Link href={user ? "/profile" : "/login"}>
            <Button variant="outline" className="w-full sm:w-auto rounded-xl gap-2 font-bold">
              <User className="w-4 h-4" />
              {user ? "پروفایل کاربری" : "ورود به حساب"}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
