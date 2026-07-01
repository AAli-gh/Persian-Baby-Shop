import { Link } from "wouter";
import { Search, Home, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4" dir="rtl">
      <div className="text-center max-w-lg">
        <div className="relative w-44 h-44 mx-auto mb-8">
          <div className="absolute inset-0 rounded-full bg-primary/10 animate-pulse" />
          <div className="absolute inset-4 rounded-full bg-primary/15" />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-7xl font-black text-primary/25 select-none">۴۰۴</span>
          </div>
          <div className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-pink-200" />
          <div className="absolute -bottom-2 -left-3 w-4 h-4 rounded-full bg-purple-200" />
          <div className="absolute top-1/2 -left-4 w-3 h-3 rounded-full bg-blue-200" />
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-muted border mb-4">
          <span className="text-xs font-bold text-muted-foreground">صفحه پیدا نشد</span>
        </div>

        <h1 className="text-3xl font-black text-foreground mb-3">اوه! اینجا چیزی نیست</h1>
        <p className="text-muted-foreground text-sm leading-relaxed mb-8">
          صفحه موردنظر پیدا نشد.
          <br />
          شاید آدرس اشتباه وارد شده یا صفحه حذف شده است.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/">
            <Button className="w-full sm:w-auto rounded-xl gap-2 font-bold">
              <Home className="w-4 h-4" />
              بازگشت به خانه
            </Button>
          </Link>
          <Link href="/shop">
            <Button variant="outline" className="w-full sm:w-auto rounded-xl gap-2 font-bold">
              <ShoppingBag className="w-4 h-4" />
              ادامه خرید
            </Button>
          </Link>
          <Link href="/shop">
            <Button variant="ghost" className="w-full sm:w-auto rounded-xl gap-2 font-bold text-muted-foreground">
              <Search className="w-4 h-4" />
              جستجو در محصولات
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
