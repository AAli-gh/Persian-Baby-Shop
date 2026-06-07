import { Link } from "wouter";
import { FileText, ChevronLeft } from "lucide-react";
import { useSEO } from "@/hooks/useSEO";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="text-lg font-black text-foreground mb-3 pb-2 border-b border-pink-100">{title}</h2>
      <div className="text-sm text-muted-foreground leading-loose space-y-2">{children}</div>
    </section>
  );
}

export default function TermsAndConditions() {
  useSEO({ title: "شرایط و قوانین استفاده", description: "شرایط و قوانین استفاده از خدمات فروشگاه آنلاین کودک‌لند." });
  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50/40 to-white" dir="rtl">
      <div className="bg-gradient-to-l from-primary/10 to-rose-50 border-b border-pink-100">
        <div className="container mx-auto max-w-4xl px-4 py-10">
          <nav className="flex items-center gap-2 text-xs text-muted-foreground mb-5">
            <Link href="/" className="hover:text-primary transition-colors">خانه</Link>
            <ChevronLeft className="w-3 h-3" />
            <span className="text-foreground font-medium">شرایط و قوانین</span>
          </nav>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
              <FileText className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-foreground">شرایط و قوانین استفاده</h1>
              <p className="text-xs text-muted-foreground mt-0.5">آخرین به‌روزرسانی: فروردین ۱۴۰۴</p>
            </div>
          </div>
        </div>
      </div>
      <div className="container mx-auto max-w-4xl px-4 py-10">
        <div className="bg-white rounded-3xl border border-pink-100 shadow-sm p-6 sm:p-10">
          <Section title="۱. پذیرش شرایط">
            <p>با ثبت‌نام یا استفاده از خدمات کودک‌لند، کاربر این شرایط را به طور کامل می‌پذیرد. در صورت عدم پذیرش، لطفاً از استفاده از سایت خودداری کنید.</p>
          </Section>
          <Section title="۲. ثبت حساب کاربری">
            <p>• ارائه اطلاعات دقیق و به‌روز در هنگام ثبت‌نام الزامی است</p>
            <p>• حساب کاربری قابل انتقال به دیگران نیست</p>
            <p>• کاربر مسئول حفظ امنیت اطلاعات ورود خود است</p>
            <p>• کودک‌لند حق تعلیق یا بستن حساب‌های متخلف را دارد</p>
          </Section>
          <Section title="۳. خرید و سفارش">
            <p>• ثبت سفارش به معنای قبول قیمت و شرایط در لحظه خرید است</p>
            <p>• کودک‌لند حق رد یا لغو سفارش در صورت مشکل موجودی یا اطلاعات نادرست را دارد</p>
            <p>• قیمت‌ها به تومان بوده و شامل مالیات می‌باشد</p>
            <p>• در صورت تغییر قیمت، قیمت ثبت‌شده در زمان سفارش معتبر است</p>
          </Section>
          <Section title="۴. محتوای کاربران">
            <p>کاربران در صورت ارسال نظر یا محتوا، این حق را به کودک‌لند می‌دهند که آن محتوا را نمایش دهد. محتوای توهین‌آمیز، مضر یا غیرقانونی حذف خواهد شد.</p>
          </Section>
          <Section title="۵. مالکیت معنوی">
            <p>تمام محتوای این وبسایت شامل تصاویر، متون، لوگو و طراحی متعلق به کودک‌لند است. کپی‌برداری بدون مجوز ممنوع است.</p>
          </Section>
          <Section title="۶. محدودیت مسئولیت">
            <p>کودک‌لند تلاش می‌کند سرویس بدون وقفه ارائه دهد اما مسئولیت قطعی‌های فنی موقت را نمی‌پذیرد. در مورد کیفیت محصولات، ضمانت‌نامه مجزا اعمال می‌شود.</p>
          </Section>
          <Section title="۷. تغییرات">
            <p>کودک‌لند حق اصلاح این شرایط را دارد. تغییرات از طریق وبسایت اطلاع‌رسانی می‌شود.</p>
          </Section>
          <Section title="۸. قانون حاکم">
            <p>این قرارداد تابع قوانین جمهوری اسلامی ایران بوده و اختلافات در چارچوب قوانین ایران حل‌وفصل خواهد شد.</p>
          </Section>
        </div>
      </div>
    </div>
  );
}
