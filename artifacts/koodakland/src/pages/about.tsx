import { Link } from "wouter";
import { Heart, Shield, Truck, Star, Users, Award, Smile, Baby, ChevronLeft } from "lucide-react";

const VALUES = [
  {
    icon: Heart,
    color: "bg-pink-100 text-pink-500",
    title: "عشق به کودکان",
    desc: "هر محصولی که انتخاب می‌کنیم، با عشق و دقت انتخاب شده تا بهترین تجربه را برای کودک شما رقم بزند.",
  },
  {
    icon: Shield,
    color: "bg-blue-100 text-blue-500",
    title: "ایمنی اول",
    desc: "تمامی محصولات ما از استانداردهای ایمنی کودک عبور کرده‌اند و از مواد بی‌خطر ساخته شده‌اند.",
  },
  {
    icon: Award,
    color: "bg-yellow-100 text-yellow-600",
    title: "کیفیت تضمین‌شده",
    desc: "ما فقط بهترین برندها و باکیفیت‌ترین محصولات را عرضه می‌کنیم تا خریدتان ارزش واقعی داشته باشد.",
  },
  {
    icon: Smile,
    color: "bg-green-100 text-green-500",
    title: "رضایت مشتری",
    desc: "خوشحالی شما و فرزندتان هدف اصلی ماست. پشتیبانی ۷ روز هفته برای پاسخ به تمام سوالات شما.",
  },
];

const STATS = [
  { value: "۱۲,۰۰۰+", label: "مشتری راضی", icon: Users },
  { value: "۵۰۰+", label: "محصول با کیفیت", icon: Baby },
  { value: "۸", label: "سال تجربه", icon: Award },
  { value: "۴.۹", label: "امتیاز مشتریان", icon: Star },
];

const TEAM = [
  { name: "مریم احمدی", role: "مدیرعامل و بنیان‌گذار", emoji: "👩‍💼", bg: "bg-pink-100" },
  { name: "علی رضایی", role: "مدیر محصول", emoji: "👨‍💻", bg: "bg-blue-100" },
  { name: "سارا کریمی", role: "متخصص کودک", emoji: "👩‍⚕️", bg: "bg-green-100" },
  { name: "رضا محمدی", role: "مدیر پشتیبانی", emoji: "👨‍💼", bg: "bg-purple-100" },
];

export default function About() {
  return (
    <div className="min-h-screen" dir="rtl">

      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-gradient-to-bl from-pink-50 via-white to-rose-50 py-20 px-4">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-10 right-16 text-6xl opacity-20 animate-bounce" style={{ animationDuration: "3s" }}>🧸</div>
          <div className="absolute top-20 left-24 text-5xl opacity-15 animate-bounce" style={{ animationDuration: "4s", animationDelay: "1s" }}>🍼</div>
          <div className="absolute bottom-10 right-1/3 text-4xl opacity-20 animate-bounce" style={{ animationDuration: "5s", animationDelay: "0.5s" }}>⭐</div>
          <div className="absolute bottom-16 left-16 text-5xl opacity-15 animate-bounce" style={{ animationDuration: "3.5s", animationDelay: "2s" }}>🌸</div>
          <div className="absolute top-1/2 left-8 text-4xl opacity-10 animate-bounce" style={{ animationDuration: "4.5s" }}>🦋</div>
        </div>

        <div className="container mx-auto max-w-4xl text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-pink-100 text-pink-600 text-sm font-medium mb-6">
            <Heart className="w-4 h-4" />
            <span>درباره کودک‌لند</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-foreground mb-6 leading-tight">
            داستان ما از{" "}
            <span className="text-primary">عشق به کودکان</span>
            {" "}شروع شد
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            کودک‌لند در سال ۱۳۹۵ با یک رویا آغاز شد: ایجاد فضایی امن و دلسوزانه برای خرید بهترین محصولات کودک در ایران. امروز بیش از ۱۲,۰۰۰ خانواده به ما اعتماد کرده‌اند.
          </p>
        </div>
      </section>

      {/* ── Story ── */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="order-2 md:order-1">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-pink-50 text-pink-600 text-xs font-semibold mb-4">
                داستان ما
              </div>
              <h2 className="text-3xl font-black text-foreground mb-4 leading-tight">
                از یک ایده ساده تا یک برند مورد اعتماد
              </h2>
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <p>
                  همه چیز از یک مادر جوان شروع شد که دنبال محصولات باکیفیت و ایمن برای نوزادش می‌گشت. مریم احمدی، بنیان‌گذار کودک‌لند، وقتی نتوانست به راحتی محصولات معتبر را پیدا کند، تصمیم گرفت خودش این مشکل را حل کند.
                </p>
                <p>
                  در سال ۱۳۹۵، با انبار کوچکی در تهران و چند صد محصول انتخاب‌شده با دقت، کودک‌لند تأسیس شد. امروز ما بیش از ۵۰۰ محصول از بهترین برندهای داخلی و خارجی ارائه می‌دهیم.
                </p>
                <p>
                  تیم ما از متخصصان کودک، طراحان، و والدین باتجربه تشکیل شده که هر محصول را با چشم یک والدین دلسوز ارزیابی می‌کنند.
                </p>
              </div>
            </div>

            <div className="order-1 md:order-2 flex justify-center">
              <div className="relative w-72 h-72">
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-pink-200 to-rose-200 rotate-6 opacity-60" />
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-tl from-pink-100 to-purple-100 -rotate-3 opacity-70" />
                <div className="relative w-full h-full rounded-3xl bg-gradient-to-br from-pink-50 to-rose-50 flex flex-col items-center justify-center border border-pink-100 shadow-xl">
                  <div className="text-7xl mb-2">🧸</div>
                  <p className="text-primary font-bold text-lg">کودک‌لند</p>
                  <p className="text-muted-foreground text-sm">از ۱۳۹۵ تا امروز</p>
                  <div className="flex gap-1 mt-3">
                    {[1,2,3,4,5].map(i => (
                      <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="py-14 px-4 bg-gradient-to-b from-pink-50/60 to-transparent">
        <div className="container mx-auto max-w-5xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {STATS.map(({ value, label, icon: Icon }) => (
              <div key={label} className="text-center p-6 rounded-2xl bg-white border border-pink-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 rounded-xl bg-pink-50 flex items-center justify-center mx-auto mb-3">
                  <Icon className="w-6 h-6 text-primary" />
                </div>
                <div className="text-3xl font-black text-foreground mb-1">{value}</div>
                <div className="text-sm text-muted-foreground">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Mission ── */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-50 text-primary text-xs font-semibold mb-4">
            مأموریت ما
          </div>
          <h2 className="text-3xl font-black text-foreground mb-4">ما اینجاییم تا...</h2>
          <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto mb-12">
            بهترین تجربه خرید محصولات کودک را برای خانواده‌های ایرانی فراهم کنیم — با محصولاتی که واقعاً ایمن، باکیفیت، و ارزش خرید دارند.
          </p>

          <div className="grid md:grid-cols-2 gap-6 text-right">
            {[
              { emoji: "🌟", title: "انتخاب هوشمند", desc: "هر محصول قبل از ورود به فروشگاه توسط تیم متخصص ما بررسی می‌شود." },
              { emoji: "🚀", title: "تحویل سریع", desc: "سفارش‌های تهران در ۲۴ ساعت و سایر شهرها در ۳-۵ روز کاری تحویل داده می‌شوند." },
              { emoji: "💝", title: "قیمت منصفانه", desc: "ما معتقدیم کیفیت نباید گران باشد. بهترین قیمت‌ها را برای شما تضمین می‌کنیم." },
              { emoji: "🔄", title: "بازگشت آسان", desc: "اگر از خریدتان راضی نبودید، بدون سوال در ۱۴ روز آن را پس می‌گیریم." },
            ].map(({ emoji, title, desc }) => (
              <div key={title} className="flex items-start gap-4 p-5 rounded-2xl bg-gradient-to-br from-pink-50/80 to-rose-50/40 border border-pink-100/60">
                <div className="text-3xl flex-shrink-0">{emoji}</div>
                <div>
                  <h3 className="font-bold text-foreground mb-1">{title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Values ── */}
      <section className="py-16 px-4 bg-gradient-to-b from-white to-pink-50/40">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-pink-100 text-pink-600 text-xs font-semibold mb-4">
              ارزش‌های ما
            </div>
            <h2 className="text-3xl font-black text-foreground">آنچه ما را متمایز می‌کند</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {VALUES.map(({ icon: Icon, color, title, desc }) => (
              <div key={title} className="text-center p-6 rounded-2xl bg-white border border-pink-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                <div className={`w-14 h-14 rounded-2xl ${color} flex items-center justify-center mx-auto mb-4`}>
                  <Icon className="w-7 h-7" />
                </div>
                <h3 className="font-bold text-foreground mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Team ── */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-50 text-purple-600 text-xs font-semibold mb-4">
              تیم ما
            </div>
            <h2 className="text-3xl font-black text-foreground">افرادی که کودک‌لند را می‌سازند</h2>
          </div>
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-6">
            {TEAM.map(({ name, role, emoji, bg }) => (
              <div key={name} className="text-center p-6 rounded-2xl bg-white border border-pink-100 shadow-sm hover:shadow-md transition-shadow">
                <div className={`w-20 h-20 rounded-full ${bg} flex items-center justify-center mx-auto mb-4 text-4xl`}>
                  {emoji}
                </div>
                <h3 className="font-bold text-foreground mb-1">{name}</h3>
                <p className="text-sm text-muted-foreground">{role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Trust ── */}
      <section className="py-16 px-4 bg-gradient-to-br from-pink-50 via-rose-50 to-pink-100/40">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-black text-foreground mb-3">چرا خانواده‌ها به ما اعتماد می‌کنند؟</h2>
            <p className="text-muted-foreground">نظر مشتریان واقعی ما</p>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {[
              { name: "فاطمه م.", text: "بهترین فروشگاه آنلاین کودک! محصولات باکیفیت و تحویل سریع. حتماً دوباره خرید می‌کنم.", stars: 5 },
              { name: "رضا ک.", text: "خیلی راحت و مطمئن خرید کردم. پشتیبانی عالی داشتن و جواب سوالاتم رو سریع دادن.", stars: 5 },
              { name: "نرگس ش.", text: "لباس‌های نوزادی که خریدم کیفیت فوق‌العاده‌ای داشتن. به همه مادرها پیشنهاد می‌دم.", stars: 5 },
            ].map(({ name, text, stars }) => (
              <div key={name} className="bg-white rounded-2xl p-6 border border-pink-100 shadow-sm">
                <div className="flex gap-1 mb-3">
                  {Array(stars).fill(0).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">«{text}»</p>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center text-sm font-bold text-primary">
                    {name.charAt(0)}
                  </div>
                  <span className="text-sm font-semibold text-foreground">{name}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-3xl text-center">
          <div className="text-5xl mb-4">🛍️</div>
          <h2 className="text-3xl font-black text-foreground mb-4">آماده خرید هستید؟</h2>
          <p className="text-muted-foreground mb-8 leading-relaxed">
            بیایید بهترین محصولات را برای فرزند عزیزتان پیدا کنید
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/shop">
              <button className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-primary text-white font-bold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20">
                <span>مشاهده محصولات</span>
                <ChevronLeft className="w-4 h-4 -rotate-180" />
              </button>
            </Link>
            <Link href="/contact">
              <button className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl border-2 border-primary/20 text-primary font-bold hover:bg-pink-50 transition-colors">
                تماس با ما
              </button>
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
