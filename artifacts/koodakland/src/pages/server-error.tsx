import { Home, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function ServerError() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4" dir="rtl">
      <div className="text-center max-w-md">
        <div className="relative w-40 h-40 mx-auto mb-8">
          <div className="absolute inset-0 rounded-full bg-orange-100 animate-pulse" />
          <div className="absolute inset-4 rounded-full bg-orange-50" />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-6xl font-black text-orange-300 select-none">۵۰۰</span>
          </div>
          <div className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-200" />
          <div className="absolute -bottom-2 -left-3 w-4 h-4 rounded-full bg-orange-200" />
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-50 border border-orange-100 mb-4">
          <span className="text-xs font-bold text-orange-500">خطای سرور</span>
        </div>

        <h1 className="text-2xl font-black text-foreground mb-3">مشکلی پیش آمده</h1>
        <p className="text-muted-foreground text-sm leading-relaxed mb-8">
          مشکلی در سرور به وجود آمده است.
          <br />
          لطفاً چند لحظه دیگر دوباره تلاش کنید.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            className="w-full sm:w-auto rounded-xl gap-2 font-bold"
            onClick={() => window.location.reload()}
          >
            <RefreshCw className="w-4 h-4" />
            تلاش مجدد
          </Button>
          <Link href="/">
            <Button variant="outline" className="w-full sm:w-auto rounded-xl gap-2 font-bold">
              <Home className="w-4 h-4" />
              بازگشت به خانه
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
