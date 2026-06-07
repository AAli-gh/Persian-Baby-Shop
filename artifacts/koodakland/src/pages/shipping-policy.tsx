import { Link } from "wouter";
import { Truck, ChevronLeft, Clock, MapPin, Package } from "lucide-react";
import { useSEO } from "@/hooks/useSEO";

export default function ShippingPolicy() {
  useSEO({ title: "سیاست ارسال و حمل‌ونقل", description: "اطلاعات کامل درباره نحوه ارسال، هزینه‌ها و زمان تحویل سفارشات کودک‌لند." });

  const zones = [
    { name: "تهران", time: "۱ تا ۲ روز کاری", cost: "۳۵,۰۰۰ تومان" },
    { name: "شهرهای بزرگ (اصفهان، مشهد، شیراز، تبریز)", time: "۲ تا ۳ روز کاری", cost: "۴۵,۰۰۰ تومان" },
    { name: "سایر شهرستان‌ها", time: "۳ تا ۵ روز کاری", cost: "۵۵,۰۰۰ تومان" },
    { name: "روستاها و مناطق دورافتاده", time: "۵ تا ۷ روز کاری", cost: "۶۵,۰۰۰ تومان" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50/40 to-white" dir="rtl">
      <div className="bg-gradient-to-l from-primary/10 to-rose-50 border-b border-pink-100">
        <div className="container mx-auto max-w-4xl px-4 py-10">
          <nav className="flex items-center gap-2 text-xs text-muted-foreground mb-5">
            <Link href="/" className="hover:text-primary transition-colors">خانه</Link>
            <ChevronLeft className="w-3 h-3" />
            <span className="text-foreground font-medium">سیاست ارسال</span>
          </nav>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Truck className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-foreground">سیاست ارسال و حمل‌ونقل</h1>
              <p className="text-xs text-muted-foreground mt-0.5">آخرین به‌روزرسانی: فروردین ۱۴۰۴</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-4xl px-4 py-10 flex flex-col gap-6">
        {/* Quick info cards */}
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            { icon: Clock, title: "زمان پردازش", desc: "۱ تا ۲ روز کاری پس از تأیید پرداخت" },
            { icon: Package, title: "بسته‌بندی", desc: "استاندارد و ایمن برای محصولات کودک" },
            { icon: MapPin, title: "سراسر ایران", desc: "ارسال به تمام نقاط کشور" },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="bg-white rounded-2xl border border-pink-100 p-5 flex gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-bold text-foreground text-sm">{title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-3xl border border-pink-100 shadow-sm p-6 sm:p-10 flex flex-col gap-8">
          <section>
            <h2 className="text-lg font-black text-foreground mb-4 pb-2 border-b border-pink-100">جدول زمان‌بندی و هزینه ارسال</h2>
            <div className="overflow-x-auto rounded-2xl border border-border/40">
              <table className="w-full text-sm">
                <thead className="bg-pink-50/50">
                  <tr>
                    {["منطقه", "زمان تحویل", "هزینه ارسال"].map(h => (
                      <th key={h} className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {zones.map(z => (
                    <tr key={z.name} className="border-t border-border/30">
                      <td className="px-4 py-3 font-medium text-foreground">{z.name}</td>
                      <td className="px-4 py-3 text-muted-foreground">{z.time}</td>
                      <td className="px-4 py-3 font-bold text-primary">{z.cost}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3 p-4 bg-green-50 border border-green-100 rounded-2xl">
              <p className="text-sm font-semibold text-green-800">🎁 ارسال رایگان برای خریدهای بالای ۵۰۰,۰۰۰ تومان (تهران) و ۸۰۰,۰۰۰ تومان (سایر شهرها)</p>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-black text-foreground mb-3 pb-2 border-b border-pink-100">روش‌های ارسال</h2>
            <div className="text-sm text-muted-foreground leading-loose space-y-2">
              <p><strong>پست پیشتاز:</strong> مناسب برای تمام نقاط کشور، قابل پیگیری</p>
              <p><strong>تیپاکس:</strong> سریع‌تر، برای شهرهای بزرگ</p>
              <p><strong>ماهکس:</strong> برای سفارشات سنگین‌تر</p>
              <p><strong>پیک موتوری (تهران):</strong> ارسال فوری در همان روز (در صورت موجودی)</p>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-black text-foreground mb-3 pb-2 border-b border-pink-100">پیگیری سفارش</h2>
            <div className="text-sm text-muted-foreground leading-loose space-y-2">
              <p>پس از ارسال سفارش، کد رهگیری از طریق پیامک ارسال می‌شود. همچنین از طریق صفحه <Link href="/track" className="text-primary hover:underline">پیگیری سفارش</Link> می‌توانید وضعیت را بررسی کنید.</p>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-black text-foreground mb-3 pb-2 border-b border-pink-100">تأخیر در ارسال</h2>
            <div className="text-sm text-muted-foreground leading-loose space-y-2">
              <p>در صورت تأخیر بیش از زمان اعلام‌شده، با پشتیبانی تماس بگیرید. در روزهای تعطیل رسمی، پردازش سفارشات معطل می‌ماند.</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
