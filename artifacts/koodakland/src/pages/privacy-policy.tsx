import { Link } from "wouter";
import { Shield, ChevronLeft } from "lucide-react";
import { useSEO } from "@/hooks/useSEO";

function LegalLayout({ title, titleFa, icon: Icon, children }: { title: string; titleFa: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50/40 to-white" dir="rtl">
      {/* Header */}
      <div className="bg-gradient-to-l from-primary/10 to-rose-50 border-b border-pink-100">
        <div className="container mx-auto max-w-4xl px-4 py-10">
          <nav className="flex items-center gap-2 text-xs text-muted-foreground mb-5">
            <Link href="/" className="hover:text-primary transition-colors">خانه</Link>
            <ChevronLeft className="w-3 h-3" />
            <span className="text-foreground font-medium">{titleFa}</span>
          </nav>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Icon className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-foreground">{titleFa}</h1>
              <p className="text-xs text-muted-foreground mt-0.5">آخرین به‌روزرسانی: فروردین ۱۴۰۴</p>
            </div>
          </div>
        </div>
      </div>
      {/* Content */}
      <div className="container mx-auto max-w-4xl px-4 py-10">
        <div className="bg-white rounded-3xl border border-pink-100 shadow-sm p-6 sm:p-10 prose prose-sm max-w-none">
          {children}
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="text-lg font-black text-foreground mb-3 pb-2 border-b border-pink-100">{title}</h2>
      <div className="text-sm text-muted-foreground leading-loose space-y-2">{children}</div>
    </section>
  );
}

export default function PrivacyPolicy() {
  useSEO({ title: "حریم خصوصی", description: "سیاست حریم خصوصی کودک‌لند — نحوه جمع‌آوری، استفاده و حفاظت از اطلاعات شخصی شما." });
  return (
    <LegalLayout title="Privacy Policy" titleFa="سیاست حریم خصوصی" icon={Shield}>
      <Section title="۱. مقدمه">
        <p>کودک‌لند به حریم خصوصی کاربران خود احترام می‌گذارد. این سیاست توضیح می‌دهد که چه اطلاعاتی جمع‌آوری می‌شود، چگونه استفاده می‌شود و چگونه از آن محافظت می‌شود.</p>
      </Section>
      <Section title="۲. اطلاعاتی که جمع‌آوری می‌کنیم">
        <p><strong>اطلاعات شخصی:</strong> نام، آدرس ایمیل، شماره موبایل، آدرس تحویل</p>
        <p><strong>اطلاعات تراکنش:</strong> تاریخچه خرید، جزئیات سفارش، اطلاعات پرداخت (رمزگذاری‌شده)</p>
        <p><strong>اطلاعات فنی:</strong> آدرس IP، نوع مرورگر، صفحات بازدیدشده، مدت زمان حضور</p>
        <p><strong>کوکی‌ها:</strong> برای بهبود تجربه کاربری و ذخیره‌سازی اطلاعات ورود</p>
      </Section>
      <Section title="۳. نحوه استفاده از اطلاعات">
        <p>• پردازش سفارشات و ارسال محصولات</p>
        <p>• ارسال اطلاعیه‌های سفارش و تحویل</p>
        <p>• بهبود خدمات و تجربه خرید</p>
        <p>• ارسال خبرنامه (با رضایت کاربر)</p>
        <p>• پیشگیری از تقلب و حفاظت از حساب‌های کاربری</p>
      </Section>
      <Section title="۴. اشتراک‌گذاری اطلاعات">
        <p>کودک‌لند اطلاعات شخصی شما را بدون رضایت صریح شما به اشخاص ثالث نمی‌فروشد، اجاره نمی‌دهد یا تبادل نمی‌کند. اطلاعات فقط در موارد ضروری با شرکای حمل‌ونقل برای تحویل سفارش به اشتراک گذاشته می‌شود.</p>
      </Section>
      <Section title="۵. امنیت داده‌ها">
        <p>تمام اطلاعات پرداخت از طریق درگاه‌های بانکی معتبر و رمزگذاری‌شده پردازش می‌شود. کودک‌لند به اطلاعات کارت بانکی شما دسترسی ندارد.</p>
      </Section>
      <Section title="۶. حقوق کاربران">
        <p>• درخواست دسترسی به اطلاعات شخصی</p>
        <p>• اصلاح اطلاعات نادرست</p>
        <p>• درخواست حذف حساب کاربری</p>
        <p>• لغو اشتراک از خبرنامه در هر زمان</p>
        <p>برای هر درخواستی با ما از طریق صفحه تماس ارتباط بگیرید.</p>
      </Section>
      <Section title="۷. کودکان">
        <p>کودک‌لند آگاهانه اطلاعات شخصی از افراد زیر ۱۸ سال جمع‌آوری نمی‌کند. والدین و سرپرستان می‌توانند در صورت مشاهده چنین مواردی با ما تماس بگیرند.</p>
      </Section>
      <Section title="۸. تغییرات در سیاست حریم خصوصی">
        <p>هرگونه تغییر در این سیاست از طریق وبسایت اطلاع‌رسانی خواهد شد. استفاده مستمر از خدمات به منزله قبول سیاست‌های جدید است.</p>
      </Section>
    </LegalLayout>
  );
}
