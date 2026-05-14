import { useState } from "react";
import { useListDiscounts, useCreateDiscount, useDeleteDiscount } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Tag, Percent, DollarSign, Clock, Users, ShoppingBag, Zap, Copy, CheckCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

const DISCOUNT_TYPES = [
  { value: "percent", label: "درصدی", icon: Percent, color: "bg-blue-100 text-blue-700", desc: "مثلاً ۲۰٪ تخفیف" },
  { value: "fixed", label: "مبلغ ثابت", icon: DollarSign, color: "bg-green-100 text-green-700", desc: "مثلاً ۵۰,۰۰۰ تومان" },
  { value: "first_purchase", label: "اولین خرید", icon: Zap, color: "bg-purple-100 text-purple-700", desc: "فقط برای مشتری جدید" },
];

const CAMPAIGN_TEMPLATES = [
  { name: "استقبال از مشتری جدید", code: "WELCOME", type: "percent", value: "15", minOrder: "200000", desc: "برای مشتریان جدید" },
  { name: "فروش پاییزه", code: "FALL20", type: "percent", value: "20", minOrder: "500000", desc: "کمپین فصلی" },
  { name: "تخفیف ویژه", code: "VIP50K", type: "fixed", value: "50000", minOrder: "300000", desc: "تخفیف مبلغ ثابت" },
  { name: "روز مادر", code: "MOM30", type: "percent", value: "30", minOrder: "400000", desc: "مناسبت خاص" },
];

const EMPTY_FORM = {
  code: "", type: "percent", value: "", minOrder: "", maxUses: "",
  expiresAt: "", isFirstPurchase: false, categoryTarget: "", note: ""
};

function StatusBadge({ d }: { d: { isActive: boolean; expiresAt: string | null; usedCount: number; maxUses: number | null } }) {
  const expired = d.expiresAt && new Date(d.expiresAt) < new Date();
  const full = d.maxUses && d.usedCount >= d.maxUses;
  if (!d.isActive) return <span className="text-xs px-2.5 py-1 rounded-full bg-muted text-muted-foreground font-semibold">غیرفعال</span>;
  if (expired) return <span className="text-xs px-2.5 py-1 rounded-full bg-red-100 text-red-600 font-semibold">منقضی</span>;
  if (full) return <span className="text-xs px-2.5 py-1 rounded-full bg-orange-100 text-orange-600 font-semibold">تمام‌شده</span>;
  return <span className="text-xs px-2.5 py-1 rounded-full bg-green-100 text-green-600 font-semibold">فعال ✓</span>;
}

export default function AdminDiscounts() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [tab, setTab] = useState<"list" | "create" | "campaigns">("list");
  const [form, setForm] = useState<typeof EMPTY_FORM>(EMPTY_FORM);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const { data: discounts, isLoading } = useListDiscounts();
  const createDiscount = useCreateDiscount();
  const deleteDiscount = useDeleteDiscount();

  const setF = (k: keyof typeof EMPTY_FORM) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.type === "checkbox" ? (e.target as HTMLInputElement).checked : e.target.value }));

  const handleCreate = () => {
    if (!form.code || !form.value) { toast({ title: "کد و مقدار الزامی است", variant: "destructive" }); return; }
    createDiscount.mutate({
      data: {
        code: form.code.toUpperCase().replace(/\s/g, ""),
        type: form.type as "percent" | "fixed",
        value: Number(form.value),
        minOrder: form.minOrder ? Number(form.minOrder) : null,
        maxUses: form.maxUses ? Number(form.maxUses) : null,
        expiresAt: form.expiresAt || null,
        isActive: true,
      }
    }, {
      onSuccess: () => { toast({ title: "کد تخفیف ایجاد شد ✅" }); setDialogOpen(false); setForm(EMPTY_FORM); qc.invalidateQueries(); setTab("list"); },
      onError: () => toast({ title: "خطا در ایجاد کد", variant: "destructive" }),
    });
  };

  const applyTemplate = (t: typeof CAMPAIGN_TEMPLATES[0]) => {
    setForm(f => ({ ...f, code: t.code, type: t.type, value: t.value, minOrder: t.minOrder }));
    setTab("create");
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const activeCount = (discounts || []).filter(d => d.isActive && (!d.expiresAt || new Date(d.expiresAt) > new Date())).length;
  const totalUsage = (discounts || []).reduce((a, b) => a + b.usedCount, 0);

  return (
    <div className="flex flex-col gap-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black flex items-center gap-2">
            <Tag className="w-6 h-6 text-primary" />
            سیستم کوپن و تخفیف
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">مدیریت حرفه‌ای کدهای تخفیف و کمپین‌ها</p>
        </div>
        <Button onClick={() => { setTab("create"); setDialogOpen(true); }} className="rounded-full gap-2 font-bold">
          <Plus className="w-4 h-4" /> کد جدید
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "کل کدها", value: (discounts || []).length, icon: Tag, color: "bg-blue-100 text-blue-600" },
          { label: "فعال", value: activeCount, icon: CheckCircle, color: "bg-green-100 text-green-600" },
          { label: "کل استفاده", value: totalUsage, icon: Users, color: "bg-purple-100 text-purple-600" },
          { label: "درآمد از تخفیف", value: "—", icon: ShoppingBag, color: "bg-orange-100 text-orange-600" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-card rounded-2xl p-4 border border-border/50 flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}><Icon className="w-4 h-4" /></div>
            <div><p className="text-xl font-black">{value}</p><p className="text-xs text-muted-foreground">{label}</p></div>
          </div>
        ))}
      </div>

      {/* Sub tabs */}
      <div className="flex gap-1 p-1 bg-muted/50 rounded-xl w-fit">
        {[["list", "کدهای موجود"], ["campaigns", "قالب‌های کمپین"]].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id as typeof tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === id ? "bg-white shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
            {label}
          </button>
        ))}
      </div>

      {/* Discount list */}
      {tab === "list" && (
        <div className="flex flex-col gap-3">
          {isLoading && <div className="h-24 rounded-2xl bg-muted animate-pulse" />}
          {(discounts || []).map(d => {
            const expired = d.expiresAt && new Date(d.expiresAt) < new Date();
            const usagePct = d.maxUses ? Math.round((d.usedCount / d.maxUses) * 100) : null;
            return (
              <div key={d.id} className={`bg-card rounded-2xl p-5 border transition-all ${expired || !d.isActive ? "border-border/30 opacity-70" : "border-border/50 hover:border-primary/30 hover:shadow-sm"}`}>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                    {d.type === "percent" ? <Percent className="w-6 h-6 text-primary" /> : <DollarSign className="w-6 h-6 text-primary" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <button onClick={() => copyCode(d.code)} className="flex items-center gap-1.5 group">
                        <span className="font-black text-lg font-mono text-foreground group-hover:text-primary transition-colors">{d.code}</span>
                        {copiedCode === d.code
                          ? <CheckCircle className="w-4 h-4 text-green-500" />
                          : <Copy className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                        }
                      </button>
                      <StatusBadge d={d as typeof d & { expiresAt: string | null; maxUses: number | null }} />
                    </div>
                    <div className="flex flex-wrap gap-3 mt-1.5 text-sm text-muted-foreground">
                      <span className="font-semibold text-foreground">
                        {d.type === "percent" ? `${d.value}٪` : `${Number(d.value).toLocaleString("fa-IR")} تومان`} تخفیف
                      </span>
                      {d.minOrder && <span>· حداقل {Number(d.minOrder).toLocaleString("fa-IR")} ت</span>}
                      {d.expiresAt && (
                        <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />تا {new Date(d.expiresAt).toLocaleDateString("fa-IR")}</span>
                      )}
                      {d.maxUses && (
                        <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{d.usedCount}/{d.maxUses} بار</span>
                      )}
                    </div>
                    {usagePct !== null && (
                      <div className="mt-2">
                        <div className="flex justify-between text-xs text-muted-foreground mb-1">
                          <span>استفاده‌شده</span><span>{usagePct}٪</span>
                        </div>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className={`h-full rounded-full transition-all ${usagePct >= 90 ? "bg-red-500" : usagePct >= 60 ? "bg-orange-500" : "bg-primary"}`} style={{ width: `${usagePct}%` }} />
                        </div>
                      </div>
                    )}
                  </div>
                  <Button size="icon" variant="ghost" className="w-8 h-8 rounded-lg hover:bg-destructive/10 hover:text-destructive shrink-0"
                    onClick={() => { if (confirm(`کد ${d.code} حذف شود؟`)) deleteDiscount.mutate({ id: d.id }, { onSuccess: () => qc.invalidateQueries() }); }}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            );
          })}
          {!isLoading && (!discounts || discounts.length === 0) && (
            <div className="text-center py-16 bg-muted/20 rounded-2xl">
              <Tag className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground">کد تخفیفی وجود ندارد</p>
            </div>
          )}
        </div>
      )}

      {/* Campaign templates */}
      {tab === "campaigns" && (
        <div className="grid sm:grid-cols-2 gap-4">
          {CAMPAIGN_TEMPLATES.map(t => (
            <div key={t.code} className="bg-card rounded-2xl p-5 border border-border/50 hover:border-primary/30 hover:shadow-md transition-all group">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <p className="font-bold text-foreground">{t.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{t.desc}</p>
                </div>
                <span className="font-mono text-sm font-black text-primary bg-primary/10 px-2.5 py-1 rounded-xl shrink-0">{t.code}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground mb-4">
                <span>{t.type === "percent" ? `${t.value}٪ تخفیف` : `${Number(t.value).toLocaleString("fa-IR")} تومان`}</span>
                <span>·</span>
                <span>حداقل {Number(t.minOrder).toLocaleString("fa-IR")} ت</span>
              </div>
              <Button size="sm" onClick={() => applyTemplate(t)} className="w-full gap-2 rounded-xl font-bold" variant="outline">
                <Zap className="w-4 h-4" />
                استفاده از این قالب
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Create dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent dir="rtl" className="max-w-lg">
          <DialogHeader><DialogTitle>ایجاد کد تخفیف جدید</DialogTitle></DialogHeader>
          <div className="flex flex-col gap-4 py-2 max-h-[60vh] overflow-y-auto pl-1">

            {/* Type selector */}
            <div>
              <label className="text-sm font-semibold mb-2 block">نوع تخفیف</label>
              <div className="grid grid-cols-3 gap-2">
                {DISCOUNT_TYPES.map(({ value, label, icon: Icon, color, desc }) => (
                  <button key={value} onClick={() => setForm(f => ({ ...f, type: value }))}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all text-center ${form.type === value ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`}>
                    <div className={`w-8 h-8 rounded-lg ${color} flex items-center justify-center`}><Icon className="w-4 h-4" /></div>
                    <span className="text-xs font-bold text-foreground">{label}</span>
                    <span className="text-[10px] text-muted-foreground">{desc}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1.5 block">کد تخفیف <span className="text-primary">*</span></label>
                <input value={form.code} onChange={setF("code")} placeholder="KOODAK20" className="h-10 w-full rounded-xl bg-muted border-none px-4 text-sm font-mono font-bold uppercase focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">
                  مقدار {form.type === "percent" ? "(٪)" : "(تومان)"} <span className="text-primary">*</span>
                </label>
                <input type="number" value={form.value} onChange={setF("value")} placeholder={form.type === "percent" ? "20" : "50000"} className="h-10 w-full rounded-xl bg-muted border-none px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1.5 block">حداقل سبد خرید (ت)</label>
                <input type="number" value={form.minOrder} onChange={setF("minOrder")} placeholder="300000" className="h-10 w-full rounded-xl bg-muted border-none px-4 text-sm focus:outline-none" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">حداکثر استفاده</label>
                <input type="number" value={form.maxUses} onChange={setF("maxUses")} placeholder="100" className="h-10 w-full rounded-xl bg-muted border-none px-4 text-sm focus:outline-none" />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> تاریخ انقضا</label>
              <input type="date" value={form.expiresAt} onChange={setF("expiresAt")} className="h-10 w-full rounded-xl bg-muted border-none px-4 text-sm focus:outline-none" dir="ltr" />
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block">یادداشت داخلی</label>
              <input value={form.note} onChange={setF("note")} placeholder="مثلاً: کمپین عید ۱۴۰۴" className="h-10 w-full rounded-xl bg-muted border-none px-4 text-sm focus:outline-none" />
            </div>

            {form.code && (
              <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4">
                <p className="text-xs text-muted-foreground mb-1">پیش‌نمایش:</p>
                <p className="font-black text-lg font-mono text-primary">{form.code.toUpperCase()}</p>
                <p className="text-sm text-foreground mt-1">
                  {form.type === "percent" ? `${form.value}٪ تخفیف` : `${Number(form.value || 0).toLocaleString("fa-IR")} تومان تخفیف`}
                  {form.minOrder && ` · حداقل خرید ${Number(form.minOrder).toLocaleString("fa-IR")} تومان`}
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>انصراف</Button>
            <Button onClick={handleCreate} disabled={createDiscount.isPending} className="font-bold gap-2">
              <Plus className="w-4 h-4" />
              {createDiscount.isPending ? "در حال ایجاد..." : "ایجاد کد تخفیف"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
