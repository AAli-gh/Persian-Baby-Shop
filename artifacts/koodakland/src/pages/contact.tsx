import { useState } from "react";
import { Phone, Mail, MapPin, Clock, Send, MessageSquare, HeadphonesIcon, ChevronLeft, CheckCircle2 } from "lucide-react";

const FAQS = [
  { q: "مدت زمان تحویل سفارش چقدر است؟", a: "سفارش‌های تهران در ۲۴ ساعت و سایر شهرها در ۳ تا ۵ روز کاری تحویل داده می‌شوند." },
  { q: "آیا امکان مرجوع کردن کالا وجود دارد؟", a: "بله، تا ۱۴ روز پس از دریافت کالا، در صورت داشتن شرایط لازم، می‌توانید مرجوع کنید." },
  { q: "نحوه پرداخت به چه صورت است؟", a: "پرداخت آنلاین از طریق درگاه بانکی امن امکان‌پذیر است." },
  { q: "آیا محصولات دارای گارانتی هستند؟", a: "محصولات اصلی دارای گارانتی معتبر هستند و جزئیات در صفحه هر محصول ذکر شده است." },
];

export default function Contact() {
  const [form, setForm] = useState({ name: "", phone: "", email: "", subject: "", message: "" });
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.message) return;
    setLoading(true);
    await new Promise(r => setTimeout(r, 1200));
    setLoading(false);
    setSent(true);
  };

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  return (
    <div className="min-h-screen" dir="rtl">

      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-gradient-to-bl from-pink-50 via-white to-blue-50/30 py-16 px-4">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-8 right-20 text-5xl opacity-20 animate-bounce" style={{ animationDuration: "3s" }}>📞</div>
          <div className="absolute top-12 left-28 text-4xl opacity-15 animate-bounce" style={{ animationDuration: "4s", animationDelay: "1s" }}>💌</div>
          <div className="absolute bottom-8 left-20 text-4xl opacity-15 animate-bounce" style={{ animationDuration: "5s" }}>🌸</div>
        </div>
        <div className="container mx-auto max-w-3xl text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-pink-100 text-pink-600 text-sm font-medium mb-5">
            <MessageSquare className="w-4 h-4" />
            <span>تماس با کودک‌لند</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-foreground mb-4 leading-tight">
            چطور می‌توانیم{" "}
            <span className="text-primary">کمکتان</span> کنیم؟
          </h1>
          <p className="text-lg text-muted-foreground">
            تیم پشتیبانی ما ۷ روز هفته آماده پاسخگویی به سوالات شماست
          </p>
        </div>
      </section>

      {/* ── Contact cards ── */}
      <section className="py-10 px-4">
        <div className="container mx-auto max-w-5xl">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: Phone, color: "bg-green-100 text-green-600", label: "تلفن پشتیبانی", value: "۰۲۱-۱۲۳۴۵۶۷۸", sub: "شنبه تا پنجشنبه ۹–۱۸" },
              { icon: Mail, color: "bg-blue-100 text-blue-600", label: "ایمیل", value: "support@koodakland.ir", sub: "پاسخ در ۲۴ ساعت" },
              { icon: MapPin, color: "bg-pink-100 text-pink-600", label: "آدرس", value: "تهران، خیابان ولیعصر", sub: "پاساژ کودک، طبقه ۲" },
              { icon: Clock, color: "bg-purple-100 text-purple-600", label: "ساعات کاری", value: "شنبه تا پنجشنبه", sub: "ساعت ۹:۰۰ تا ۱۸:۰۰" },
            ].map(({ icon: Icon, color, label, value, sub }) => (
              <div key={label} className="text-center p-6 rounded-2xl bg-white border border-pink-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300">
                <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center mx-auto mb-3`}>
                  <Icon className="w-6 h-6" />
                </div>
                <p className="text-xs text-muted-foreground mb-1">{label}</p>
                <p className="font-bold text-foreground text-sm mb-0.5">{value}</p>
                <p className="text-xs text-muted-foreground">{sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Form + Info ── */}
      <section className="py-10 px-4">
        <div className="container mx-auto max-w-5xl">
          <div className="grid lg:grid-cols-5 gap-8">

            {/* Contact Form */}
            <div className="lg:col-span-3">
              <div className="bg-white rounded-3xl border border-pink-100 shadow-sm p-8">
                <h2 className="text-2xl font-black text-foreground mb-1">ارسال پیام</h2>
                <p className="text-sm text-muted-foreground mb-6">فرم زیر را تکمیل کنید. در اسرع وقت پاسخ می‌دهیم.</p>

                {sent ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center gap-4">
                    <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
                      <CheckCircle2 className="w-10 h-10 text-green-500" />
                    </div>
                    <h3 className="text-xl font-bold text-foreground">پیام شما ارسال شد!</h3>
                    <p className="text-muted-foreground text-sm">در کمترین زمان ممکن پاسخ می‌دهیم.</p>
                    <button
                      onClick={() => { setSent(false); setForm({ name: "", phone: "", email: "", subject: "", message: "" }); }}
                      className="mt-2 px-6 py-2.5 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors"
                    >
                      ارسال پیام جدید
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1.5">نام و نام خانوادگی <span className="text-primary">*</span></label>
                        <input
                          value={form.name}
                          onChange={set("name")}
                          required
                          placeholder="مثلاً: سارا احمدی"
                          className="w-full h-11 px-4 rounded-xl bg-pink-50/60 border border-pink-100 text-sm text-foreground placeholder:text-pink-300 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-all"
                          dir="rtl"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1.5">شماره تماس</label>
                        <input
                          value={form.phone}
                          onChange={set("phone")}
                          placeholder="۰۹۱۲ ..."
                          className="w-full h-11 px-4 rounded-xl bg-pink-50/60 border border-pink-100 text-sm text-foreground placeholder:text-pink-300 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-all"
                          dir="rtl"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1.5">ایمیل</label>
                      <input
                        value={form.email}
                        onChange={set("email")}
                        type="email"
                        placeholder="example@email.com"
                        className="w-full h-11 px-4 rounded-xl bg-pink-50/60 border border-pink-100 text-sm text-foreground placeholder:text-pink-300 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-all"
                        dir="ltr"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1.5">موضوع</label>
                      <select
                        value={form.subject}
                        onChange={set("subject")}
                        className="w-full h-11 px-4 rounded-xl bg-pink-50/60 border border-pink-100 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-all appearance-none"
                        dir="rtl"
                      >
                        <option value="">موضوع را انتخاب کنید</option>
                        <option value="order">سوال درباره سفارش</option>
                        <option value="product">سوال درباره محصول</option>
                        <option value="return">مرجوعی و بازگشت</option>
                        <option value="payment">مشکل پرداخت</option>
                        <option value="other">سایر</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1.5">پیام <span className="text-primary">*</span></label>
                      <textarea
                        value={form.message}
                        onChange={set("message")}
                        required
                        rows={5}
                        placeholder="پیام خود را اینجا بنویسید..."
                        className="w-full px-4 py-3 rounded-xl bg-pink-50/60 border border-pink-100 text-sm text-foreground placeholder:text-pink-300 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-all resize-none"
                        dir="rtl"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full h-12 rounded-xl bg-primary text-white font-bold flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-60 shadow-md shadow-primary/20"
                    >
                      {loading ? (
                        <div className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          ارسال پیام
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>
            </div>

            {/* Side info */}
            <div className="lg:col-span-2 space-y-5">

              {/* Quick support */}
              <div className="bg-gradient-to-br from-primary to-rose-500 rounded-3xl p-6 text-white">
                <HeadphonesIcon className="w-8 h-8 mb-3 opacity-90" />
                <h3 className="text-lg font-bold mb-1">پشتیبانی فوری</h3>
                <p className="text-sm opacity-80 mb-4">برای سوالات فوری می‌توانید مستقیم تماس بگیرید</p>
                <a href="tel:02112345678" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/20 text-white text-sm font-bold hover:bg-white/30 transition-colors">
                  <Phone className="w-4 h-4" />
                  ۰۲۱-۱۲۳۴۵۶۷۸
                </a>
              </div>

              {/* Map placeholder */}
              <div className="bg-white rounded-3xl border border-pink-100 shadow-sm overflow-hidden">
                <div className="h-44 bg-gradient-to-br from-pink-50 to-blue-50 flex flex-col items-center justify-center relative">
                  <div className="absolute inset-0 opacity-10" style={{
                    backgroundImage: "repeating-linear-gradient(0deg, #f9a8d4 0px, #f9a8d4 1px, transparent 1px, transparent 40px), repeating-linear-gradient(90deg, #f9a8d4 0px, #f9a8d4 1px, transparent 1px, transparent 40px)"
                  }} />
                  <MapPin className="w-10 h-10 text-primary mb-2 drop-shadow-sm" />
                  <p className="text-sm font-semibold text-foreground">تهران، خیابان ولیعصر</p>
                  <p className="text-xs text-muted-foreground">پاساژ کودک، طبقه ۲، واحد ۱۵</p>
                </div>
                <div className="p-4">
                  <p className="text-sm font-semibold text-foreground mb-1">آدرس دقیق</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    تهران، خیابان ولیعصر، پاساژ کودک، طبقه دوم، واحد ۱۵
                  </p>
                  <div className="mt-3 pt-3 border-t border-pink-50">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                      <span>شنبه تا پنجشنبه — ۹:۰۰ تا ۱۸:۰۰</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Social */}
              <div className="bg-white rounded-3xl border border-pink-100 shadow-sm p-5">
                <h3 className="font-bold text-foreground mb-3 text-sm">ما را در شبکه‌های اجتماعی دنبال کنید</h3>
                <div className="flex gap-3 flex-wrap">
                  {[
                    { name: "اینستاگرام", emoji: "📸", color: "bg-pink-50 text-pink-600 hover:bg-pink-100" },
                    { name: "تلگرام", emoji: "✈️", color: "bg-blue-50 text-blue-600 hover:bg-blue-100" },
                    { name: "واتساپ", emoji: "💬", color: "bg-green-50 text-green-600 hover:bg-green-100" },
                  ].map(({ name, emoji, color }) => (
                    <button key={name} className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${color}`}>
                      <span>{emoji}</span>
                      {name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-14 px-4 bg-gradient-to-b from-pink-50/40 to-transparent">
        <div className="container mx-auto max-w-3xl">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-pink-100 text-pink-600 text-xs font-semibold mb-4">
              سوالات متداول
            </div>
            <h2 className="text-3xl font-black text-foreground">پرتکرارترین سوالات</h2>
          </div>
          <div className="space-y-3">
            {FAQS.map(({ q, a }) => (
              <details key={q} className="group bg-white rounded-2xl border border-pink-100 shadow-sm overflow-hidden">
                <summary className="flex items-center justify-between gap-4 px-6 py-4 cursor-pointer select-none list-none font-semibold text-foreground text-sm hover:text-primary transition-colors">
                  {q}
                  <ChevronLeft className="w-4 h-4 flex-shrink-0 text-muted-foreground group-open:-rotate-90 transition-transform duration-200" />
                </summary>
                <div className="px-6 pb-4 text-sm text-muted-foreground leading-relaxed border-t border-pink-50 pt-3">
                  {a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}
