import { useState, useEffect } from "react";
import { useSEO } from "@/hooks/useSEO";
import { CheckCircle, Circle, Printer, RotateCcw, ChevronDown, ChevronUp } from "lucide-react";
import { Link } from "wouter";

const CHECKLISTS = [
  {
    id: "newborn",
    emoji: "🍼",
    title: "ضروریات نوزاد",
    subtitle: "همه چیز برای استقبال از عضو جدید خانواده",
    color: "from-pink-400 to-rose-400",
    bg: "bg-pink-50",
    border: "border-pink-200",
    items: [
      { id: "n1", text: "لباس‌های نوزاد (سایز ۰ تا ۳ ماه)", category: "پوشاک" },
      { id: "n2", text: "پوشاک (پیشبند، جوراب، کلاه)", category: "پوشاک" },
      { id: "n3", text: "تخت نوزاد یا گهواره", category: "خواب" },
      { id: "n4", text: "تشک مناسب نوزاد", category: "خواب" },
      { id: "n5", text: "پتو و ملحفه نوزاد", category: "خواب" },
      { id: "n6", text: "کیسه خواب نوزاد", category: "خواب" },
      { id: "n7", text: "کالسکه", category: "جابجایی" },
      { id: "n8", text: "کریر یا حامل نوزاد", category: "جابجایی" },
      { id: "n9", text: "صندلی ماشین نوزاد (استاندارد)", category: "جابجایی" },
      { id: "n10", text: "وان حمام نوزاد", category: "بهداشت" },
      { id: "n11", text: "شامپو و صابون ملایم نوزاد", category: "بهداشت" },
      { id: "n12", text: "کرم پوشک", category: "بهداشت" },
      { id: "n13", text: "دستمال مرطوب نوزاد", category: "بهداشت" },
      { id: "n14", text: "دماسنج دیجیتال", category: "سلامت" },
      { id: "n15", text: "تراز وزن نوزاد", category: "سلامت" },
      { id: "n16", text: "آسپیراتور بینی", category: "سلامت" },
    ],
  },
  {
    id: "sleep",
    emoji: "🌙",
    title: "ملزومات خواب",
    subtitle: "محیطی ایمن و آرام برای خواب کودک",
    color: "from-blue-400 to-indigo-400",
    bg: "bg-blue-50",
    border: "border-blue-200",
    items: [
      { id: "s1", text: "تخت یا گهواره استاندارد", category: "اصلی" },
      { id: "s2", text: "تشک سفت و صاف مخصوص نوزاد", category: "اصلی" },
      { id: "s3", text: "ملحفه ضد آب", category: "اصلی" },
      { id: "s4", text: "۲ تا ۳ دست ملحفه اضافه", category: "اصلی" },
      { id: "s5", text: "کیسه خواب گرم زمستانی", category: "پوشش" },
      { id: "s6", text: "کیسه خواب سبک تابستانی", category: "پوشش" },
      { id: "s7", text: "پتوی نوزاد", category: "پوشش" },
      { id: "s8", text: "دستگاه نویز سفید یا لالایی", category: "محیط" },
      { id: "s9", text: "چراغ خواب کم‌نور", category: "محیط" },
      { id: "s10", text: "پرده ضد نور", category: "محیط" },
      { id: "s11", text: "دماسنج اتاق (دمای ایده‌آل: ۱۸ تا ۲۰ درجه)", category: "محیط" },
      { id: "s12", text: "مانیتور نوزاد (بیبی مانیتور)", category: "امنیت" },
      { id: "s13", text: "حفاظ تخت (در صورت نیاز)", category: "امنیت" },
    ],
  },
  {
    id: "feeding",
    emoji: "🍼",
    title: "ملزومات تغذیه",
    subtitle: "تمام ابزارهای لازم برای تغذیه سالم",
    color: "from-green-400 to-emerald-400",
    bg: "bg-green-50",
    border: "border-green-200",
    items: [
      { id: "f1", text: "شیشه شیر (حداقل ۴ عدد)", category: "شیردهی" },
      { id: "f2", text: "پستانک سیلیکونی", category: "شیردهی" },
      { id: "f3", text: "شیردوش برقی یا دستی", category: "شیردهی" },
      { id: "f4", text: "کیسه نگهداری شیر مادر", category: "شیردهی" },
      { id: "f5", text: "لباس شیردهی مادر", category: "شیردهی" },
      { id: "f6", text: "استرلایزر بخار شیشه شیر", category: "بهداشت" },
      { id: "f7", text: "برس تمیزکننده شیشه شیر", category: "بهداشت" },
      { id: "f8", text: "پیشبند آبچکان", category: "بهداشت" },
      { id: "f9", text: "دستمال ضد آب زیر بشقاب", category: "بهداشت" },
      { id: "f10", text: "صندلی کمکی (برای ۴ ماه به بالا)", category: "تجهیزات" },
      { id: "f11", text: "بشقاب و قاشق مخصوص نوزاد", category: "تجهیزات" },
      { id: "f12", text: "فنجان آموزشی", category: "تجهیزات" },
      { id: "f13", text: "غذاساز کوچک (برای پوره)", category: "تجهیزات" },
    ],
  },
];

type ChecklistId = string;
type ItemId = string;
type CheckedMap = Record<ChecklistId, Record<ItemId, boolean>>;

const STORAGE_KEY = "kl_checklists";

function loadChecked(): CheckedMap {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"); } catch { return {}; }
}
function saveChecked(data: CheckedMap) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export default function BabyChecklists() {
  useSEO({
    title: "چک‌لیست مادر و نوزاد",
    description: "چک‌لیست کامل ضروریات نوزاد، خواب و تغذیه. تعاملی، قابل چاپ و موبایل‌فرند.",
    keywords: "چک لیست نوزاد، ضروریات نوزاد، لیست خرید نوزاد",
  });

  const [checked, setChecked] = useState<CheckedMap>(loadChecked);
  const [open, setOpen] = useState<Record<string, boolean>>({ newborn: true, sleep: false, feeding: false });

  const toggle = (listId: string, itemId: string) => {
    setChecked(prev => {
      const next = { ...prev, [listId]: { ...(prev[listId] || {}), [itemId]: !prev[listId]?.[itemId] } };
      saveChecked(next);
      return next;
    });
  };

  const resetList = (listId: string) => {
    setChecked(prev => { const next = { ...prev, [listId]: {} }; saveChecked(next); return next; });
  };

  const progress = (listId: string, items: typeof CHECKLISTS[0]["items"]) => {
    const done = items.filter(i => checked[listId]?.[i.id]).length;
    return { done, total: items.length, pct: Math.round((done / items.length) * 100) };
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50/60 to-white pb-12" dir="rtl">
      {/* Hero */}
      <div className="bg-gradient-to-l from-primary/10 to-rose-50 border-b border-pink-100 py-12 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <div className="text-5xl mb-4">🧸</div>
          <h1 className="text-3xl sm:text-4xl font-black text-foreground mb-3">مرکز چک‌لیست کودک</h1>
          <p className="text-muted-foreground max-w-xl mx-auto">همه چیزی که برای آماده شدن برای ورود کوچولو نیاز دارید. هر مورد را که آماده کردید تیک بزنید!</p>
          <button onClick={() => window.print()} className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white border border-pink-200 text-sm font-medium text-foreground hover:bg-pink-50 transition-colors shadow-sm">
            <Printer className="w-4 h-4" /> چاپ چک‌لیست
          </button>
        </div>
      </div>

      <div className="container mx-auto max-w-4xl px-4 py-8 flex flex-col gap-6">
        {CHECKLISTS.map(list => {
          const { done, total, pct } = progress(list.id, list.items);
          const isOpen = open[list.id];
          const categories = [...new Set(list.items.map(i => i.category))];

          return (
            <div key={list.id} className={`bg-white rounded-3xl border ${list.border} shadow-sm overflow-hidden`}>
              {/* Header */}
              <button
                className={`w-full ${list.bg} p-6 flex items-center gap-4 text-right`}
                onClick={() => setOpen(o => ({ ...o, [list.id]: !o[list.id] }))}
              >
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${list.color} flex items-center justify-center text-2xl flex-shrink-0 shadow-sm`}>
                  {list.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-black text-foreground">{list.title}</h2>
                  <p className="text-sm text-muted-foreground">{list.subtitle}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <div className="flex-1 h-2 bg-white/60 rounded-full overflow-hidden">
                      <div className={`h-full bg-gradient-to-r ${list.color} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-xs font-bold text-foreground whitespace-nowrap">{done}/{total}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {done > 0 && (
                    <button onClick={e => { e.stopPropagation(); resetList(list.id); }} className="p-2 rounded-xl hover:bg-white/60 transition-colors" title="ریست">
                      <RotateCcw className="w-4 h-4 text-muted-foreground" />
                    </button>
                  )}
                  {isOpen ? <ChevronUp className="w-5 h-5 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
                </div>
              </button>

              {/* Items */}
              {isOpen && (
                <div className="p-6">
                  {categories.map(cat => {
                    const catItems = list.items.filter(i => i.category === cat);
                    return (
                      <div key={cat} className="mb-5 last:mb-0">
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-3 px-1">{cat}</p>
                        <div className="flex flex-col gap-2">
                          {catItems.map(item => {
                            const isDone = !!checked[list.id]?.[item.id];
                            return (
                              <button
                                key={item.id}
                                onClick={() => toggle(list.id, item.id)}
                                className={`flex items-center gap-3 p-3 rounded-xl transition-all text-right w-full group ${isDone ? `${list.bg} border ${list.border}` : "hover:bg-muted/30 border border-transparent"}`}
                              >
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${isDone ? "text-white bg-gradient-to-br " + list.color : "border-2 border-muted-foreground/30 group-hover:border-primary/50"}`}>
                                  {isDone ? <CheckCircle className="w-4 h-4" /> : <Circle className="w-4 h-4 text-transparent" />}
                                </div>
                                <span className={`text-sm transition-colors ${isDone ? "line-through text-muted-foreground" : "text-foreground"}`}>
                                  {item.text}
                                </span>
                                {isDone && <span className="mr-auto text-xs text-green-600 font-medium">✓ آماده</span>}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}

                  {done === total && (
                    <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-2xl text-center">
                      <p className="text-green-700 font-bold text-sm">🎉 عالی! همه موارد آماده‌اند!</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* CTA */}
        <div className="bg-gradient-to-l from-primary/10 to-rose-50 rounded-3xl p-8 text-center border border-pink-100">
          <div className="text-4xl mb-3">🛍️</div>
          <h3 className="text-xl font-black text-foreground mb-2">موردی روی لیست ندارید؟</h3>
          <p className="text-sm text-muted-foreground mb-5">همه محصولات مورد نیاز نوزاد را در کودک‌لند پیدا کنید</p>
          <Link href="/shop" className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-white font-bold text-sm hover:bg-primary/90 transition-colors shadow-md">
            خرید محصولات نوزاد
          </Link>
        </div>
      </div>
    </div>
  );
}
