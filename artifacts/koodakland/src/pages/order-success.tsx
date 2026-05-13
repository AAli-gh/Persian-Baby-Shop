import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";

export default function OrderSuccess() {
  const params = new URLSearchParams(window.location.search);
  const orderNumber = params.get("order") || "";
  return (
    <div className="min-h-[70vh] flex items-center justify-center" dir="rtl">
      <div className="text-center px-4 max-w-md">
        <div className="w-24 h-24 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-12 h-12 text-green-600" />
        </div>
        <h1 className="text-2xl font-black mb-2">سفارش ثبت شد</h1>
        {orderNumber && <p className="text-muted-foreground mb-2">شماره سفارش: <span className="font-bold text-primary">#{orderNumber}</span></p>}
        <p className="text-muted-foreground mb-8">سفارش شما با موفقیت ثبت شد و در اسرع وقت پردازش می‌شود.</p>
        <div className="flex gap-3 justify-center">
          <Link href="/"><Button className="rounded-full font-bold">بازگشت به خانه</Button></Link>
          <Link href="/profile"><Button variant="outline" className="rounded-full">پیگیری سفارش</Button></Link>
        </div>
      </div>
    </div>
  );
}
