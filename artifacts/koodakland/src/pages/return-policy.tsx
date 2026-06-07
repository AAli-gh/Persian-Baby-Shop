import { Link } from "wouter";
import { RotateCcw, ChevronLeft, CheckCircle, XCircle, Clock } from "lucide-react";
import { useSEO } from "@/hooks/useSEO";

export default function ReturnPolicy() {
  useSEO({ title: "سیاست مرجوعی و بازگشت کالا", description: "شرایط و مراحل مرجوعی و بازگشت کالا در فروشگاه کودک‌لند. ضمانت ۱۴ روزه بازگشت." });

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50/40 to-white" dir="rtl">
      <div className="bg-gradient-to-l from-primary/10 to-rose-50 border-b border-pink-100">
        <div className="container mx-auto max-w-4xl px-4 py-10">
          <nav className="flex items-center gap-2 text-xs text-muted-foreground mb-5">
            <Link href="/" className="hover:text-primary transition-colors">خانه</Link>
            <ChevronLeft className="w-3 h-3" />
            <span className="text-foreground font-medium">سیاست مرجوعی</span>
          </nav>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
              <RotateCcw className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black">سیاست مرجوعی و بازگشت کالا</h1>
              <p className="text-xs text-muted-foreground mt-0.5">ضمانت ۱۴ روزه بازگشت بدون دردسر</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-4xl px-4 py-10 flex flex-col gap-6">
        {/* Guarantee banner */}
        <div className="bg-gradient-to-l from-green-50 to-emerald-50 border border-green-100 rounded-3xl p-6 flex items-center gap-4">
          <div className="text-4xl">✅</div>
          <div>
            <h2 className="font-black text-green-800 text-lg">ضمانت ۱۴ روزه بازگشت</h2>
            <p className="text-sm text-green-700 mt-1">اگر به هر دلیلی از خرید راضی نبودید، تا ۱۴ روز می‌توانید کالا را برگردانید.</p>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-pink-100 shadow-sm p-6 sm:p-10 flex flex-col gap-8">
          <section>
            <h2 className="text-lg font-black mb-4 pb-2 border-b border-pink-100">شرایط پذیرش مرجوعی</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="p-4 bg-green-50 rounded-2xl border border-green-100">
                <p className="font-bold text-green-800 mb-3 flex items-center gap-2"><CheckCircle className="w-4 h-4" />قابل برگشت</p>
                <ul className="text-sm text-green-700 space-y-1">
                  <li>• محصول در بسته‌بندی اصلی</li>
                  <li>• بدون آسیب یا استفاده</li>
                  <li>• با تمام اقلام همراه</li>
                  <li>• در مهلت ۱۴ روزه</li>
                  <li>• با کد سفارش معتبر</li>
                </ul>
              </div>
              <div className="p-4 bg-red-50 rounded-2xl border border-red-100">
                <p className="font-bold text-red-800 mb-3 flex items-center gap-2"><XCircle className="w-4 h-4" />غیرقابل برگشت</p>
                <ul className="text-sm text-red-700 space-y-1">
                  <li>• محصولات بهداشتی باز‌شده</li>
                  <li>• لباس‌های شسته‌شده</li>
                  <li>• محصولات آسیب‌دیده توسط مشتری</li>
                  <li>• محصولات تخفیف‌خورده (flash sale)</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-black mb-4 pb-2 border-b border-pink-100">مراحل بازگشت کالا</h2>
            <div className="flex flex-col gap-4">
              {[
                { step: "۱", title: "تماس با پشتیبانی", desc: "از طریق صفحه تماس یا شماره تلفن درخواست مرجوعی ثبت کنید." },
                { step: "۲", title: "دریافت کد مرجوعی", desc: "در عرض ۲۴ ساعت کد و راهنمای ارسال برای شما ارسال می‌شود." },
                { step: "۳", title: "ارسال محصول", desc: "کالا را در بسته‌بندی مناسب با کد مرجوعی ارسال کنید." },
                { step: "۴", title: "بازپرداخت", desc: "پس از دریافت و بررسی، مبلغ تا ۵ روز کاری به حساب شما واریز می‌شود." },
              ].map(({ step, title, desc }) => (
                <div key={step} className="flex items-start gap-4 p-4 rounded-2xl bg-pink-50/50 border border-pink-100">
                  <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-black text-sm flex-shrink-0">{step}</div>
                  <div>
                    <p className="font-bold text-foreground">{title}</p>
                    <p className="text-sm text-muted-foreground mt-0.5">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-lg font-black mb-3 pb-2 border-b border-pink-100">هزینه ارسال مرجوعی</h2>
            <div className="text-sm text-muted-foreground leading-loose space-y-2">
              <p>• اگر مرجوعی به دلیل <strong>نقص محصول</strong> یا <strong>ارسال اشتباه</strong> باشد: هزینه ارسال برعهده کودک‌لند</p>
              <p>• اگر مرجوعی به دلیل <strong>تغییر نظر مشتری</strong> باشد: هزینه ارسال برعهده مشتری</p>
            </div>
          </section>

          <section className="text-center">
            <p className="text-sm text-muted-foreground mb-4">سوال دارید؟</p>
            <Link href="/contact" className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-white font-bold text-sm hover:bg-primary/90 transition-colors">
              تماس با پشتیبانی
            </Link>
          </section>
        </div>
      </div>
    </div>
  );
}
