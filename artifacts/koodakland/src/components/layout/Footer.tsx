import { Link } from "wouter";
import { Heart, Phone, Mail, MapPin, Instagram, Send, Shield, Truck, RotateCcw, CreditCard, ChevronLeft } from "lucide-react";
import { useState } from "react";
import { useListCategories } from "@workspace/api-client-react";
import { useMutation } from "@tanstack/react-query";

const QUICK_LINKS = [
  { href: "/", label: "خانه" },
  { href: "/shop", label: "فروشگاه" },
  { href: "/blog", label: "وبلاگ" },
  { href: "/about", label: "درباره ما" },
  { href: "/contact", label: "تماس با ما" },
];

const SUPPORT_LINKS = [
  { href: "/track", label: "پیگیری سفارش" },
  { href: "/contact", label: "پشتیبانی" },
  { href: "/return-policy", label: "مرجوعی و بازگشت" },
  { href: "/contact", label: "سوالات متداول" },
  { href: "/login", label: "ورود / ثبت‌نام" },
];

const LEGAL_LINKS = [
  { href: "/privacy-policy", label: "حریم خصوصی" },
  { href: "/terms-and-conditions", label: "قوانین و مقررات" },
  { href: "/shipping-policy", label: "سیاست ارسال" },
  { href: "/return-policy", label: "سیاست مرجوعی" },
];

const TRUST_BADGES = [
  { icon: Shield, label: "خرید امن", sub: "درگاه بانکی معتبر", color: "text-blue-500", bg: "bg-blue-50" },
  { icon: Truck, label: "ارسال سریع", sub: "تحویل ۲۴ تا ۷۲ ساعته", color: "text-green-500", bg: "bg-green-50" },
  { icon: RotateCcw, label: "ضمانت بازگشت", sub: "تا ۱۴ روز پس از خرید", color: "text-orange-500", bg: "bg-orange-50" },
  { icon: CreditCard, label: "پرداخت آنلاین", sub: "امن و مطمئن", color: "text-purple-500", bg: "bg-purple-50" },
];

export function Footer() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [subMessage, setSubMessage] = useState("");
  const { data: categories } = useListCategories();
  const cats = (categories || []).slice(0, 5);

  const subscribeMutation = useMutation({
    mutationFn: (email: string) => fetch("/api/newsletter/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, source: "footer" }),
    }).then(r => r.json()),
    onSuccess: (data) => {
      setSubscribed(true);
      setSubMessage(data.message || "با موفقیت عضو شدید!");
      setEmail("");
    },
    onError: () => {
      setSubMessage("خطایی رخ داد. دوباره تلاش کنید.");
    },
  });

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    subscribeMutation.mutate(email);
  };

  return (
    <footer className="w-full" dir="rtl">

      {/* ── Trust badges ── */}
      <div className="border-t border-pink-100 bg-gradient-to-b from-pink-50/60 to-white">
        <div className="container mx-auto max-w-6xl px-4 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {TRUST_BADGES.map(({ icon: Icon, label, sub, color, bg }) => (
              <div key={label} className="flex items-center gap-3 p-3 rounded-2xl bg-white border border-pink-50 shadow-sm">
                <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}>
                  <Icon className={`w-5 h-5 ${color}`} />
                </div>
                <div>
                  <p className="font-bold text-foreground text-sm">{label}</p>
                  <p className="text-xs text-muted-foreground">{sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Newsletter ── */}
      <div className="bg-gradient-to-l from-primary/90 to-rose-500/90 py-10 px-4">
        <div className="container mx-auto max-w-2xl text-center">
          <div className="text-3xl mb-2">💌</div>
          <h3 className="text-xl font-black text-white mb-1">عضو خبرنامه کودک‌لند شوید</h3>
          <p className="text-white/80 text-sm mb-5">
            اول از تخفیف‌ها و محصولات جدید باخبر شوید
          </p>
          {subscribed ? (
            <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white/20 text-white font-medium text-sm">
              ✅ {subMessage || "ثبت‌نام شما با موفقیت انجام شد!"}
            </div>
          ) : (
            <form onSubmit={handleSubscribe} className="flex gap-2 max-w-sm mx-auto">
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="ایمیل خود را وارد کنید"
                required
                className="flex-1 h-11 px-4 rounded-xl bg-white/20 border border-white/30 text-white placeholder:text-white/50 text-sm focus:outline-none focus:ring-2 focus:ring-white/40 backdrop-blur-sm"
                dir="ltr"
              />
              <button
                type="submit"
                disabled={subscribeMutation.isPending}
                className="h-11 px-5 rounded-xl bg-white text-primary font-bold text-sm hover:bg-white/90 transition-colors flex items-center gap-1.5 flex-shrink-0 disabled:opacity-70"
              >
                <Send className="w-4 h-4" />
                {subscribeMutation.isPending ? "..." : "عضویت"}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* ── Main footer body ── */}
      <div className="bg-slate-900 text-slate-300 py-14 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-10">

            {/* Brand column */}
            <div className="lg:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
                  <span className="text-white text-sm font-black">ک</span>
                </div>
                <span className="font-black text-2xl text-white">کودک‌لند</span>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed mb-5 max-w-xs">
                بهترین فروشگاه آنلاین محصولات کودک در ایران. از ۱۳۹۵ با عشق و دقت، بهترین محصولات را برای خانواده‌های ایرانی انتخاب می‌کنیم.
              </p>

              {/* Contact info */}
              <div className="space-y-2.5">
                {[
                  { icon: Phone, text: "۰۲۱-۱۲۳۴۵۶۷۸" },
                  { icon: Mail, text: "support@koodakland.ir" },
                  { icon: MapPin, text: "تهران، پاساژ کودک، طبقه ۲" },
                ].map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-center gap-2.5 text-sm text-slate-400">
                    <Icon className="w-4 h-4 text-primary flex-shrink-0" />
                    <span>{text}</span>
                  </div>
                ))}
              </div>

              {/* Social */}
              <div className="flex gap-3 mt-5">
                {[
                  { Icon: Instagram, label: "اینستاگرام", color: "hover:bg-pink-500" },
                  { Icon: Send, label: "تلگرام", color: "hover:bg-blue-500" },
                ].map(({ Icon, label, color }) => (
                  <button
                    key={label}
                    aria-label={label}
                    className={`w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center ${color} hover:text-white transition-colors`}
                  >
                    <Icon className="w-4 h-4" />
                  </button>
                ))}
                {/* WhatsApp */}
                <button
                  aria-label="واتساپ"
                  className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center hover:bg-green-500 hover:text-white transition-colors text-sm font-bold"
                >
                  W
                </button>
              </div>
            </div>

            {/* Quick links */}
            <div>
              <h4 className="text-white font-bold mb-4">دسترسی سریع</h4>
              <ul className="space-y-2.5">
                {QUICK_LINKS.map(({ href, label }) => (
                  <li key={href}>
                    <Link href={href} className="text-sm text-slate-400 hover:text-primary transition-colors flex items-center gap-1 group">
                      <ChevronLeft className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all duration-200 text-primary" />
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Categories */}
            <div>
              <h4 className="text-white font-bold mb-4">دسته‌بندی‌ها</h4>
              <ul className="space-y-2.5">
                {cats.length > 0
                  ? cats.map(c => (
                    <li key={c.id}>
                      <Link href={`/shop?category=${c.slug}`} className="text-sm text-slate-400 hover:text-primary transition-colors flex items-center gap-1 group">
                        <ChevronLeft className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all duration-200 text-primary" />
                        {c.nameFa}
                      </Link>
                    </li>
                  ))
                  : ["لباس کودک", "اسباب‌بازی", "تغذیه", "خواب", "بهداشت"].map(c => (
                    <li key={c}>
                      <Link href="/shop" className="text-sm text-slate-400 hover:text-primary transition-colors">{c}</Link>
                    </li>
                  ))
                }
              </ul>
            </div>

            {/* Support */}
            <div>
              <h4 className="text-white font-bold mb-4">پشتیبانی</h4>
              <ul className="space-y-2.5">
                {SUPPORT_LINKS.map(({ href, label }) => (
                  <li key={label}>
                    <Link href={href} className="text-sm text-slate-400 hover:text-primary transition-colors flex items-center gap-1 group">
                      <ChevronLeft className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all duration-200 text-primary" />
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>

              {/* Working hours box */}
              <div className="mt-6 p-4 rounded-2xl bg-slate-800 border border-slate-700">
                <p className="text-xs font-semibold text-white mb-2">ساعات پشتیبانی</p>
                <p className="text-xs text-slate-400">شنبه تا پنجشنبه</p>
                <p className="text-sm font-bold text-primary">۹:۰۰ – ۱۸:۰۰</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom bar ── */}
      <div className="bg-slate-950 py-4 px-4">
        <div className="container mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <p>
            © ۱۴۰۳ کودک‌لند. تمامی حقوق محفوظ است.
          </p>
          <p className="flex items-center gap-1">
            ساخته‌شده با <Heart className="w-3 h-3 text-primary fill-primary" /> برای خانواده‌های ایرانی
          </p>
          <div className="flex flex-wrap gap-4">
            {LEGAL_LINKS.map(({ href, label }) => (
              <Link key={href} href={href} className="hover:text-slate-300 transition-colors">{label}</Link>
            ))}
          </div>
        </div>
      </div>

    </footer>
  );
}
