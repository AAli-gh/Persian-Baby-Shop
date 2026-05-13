import { useState } from "react";
import { useListDiscounts, useCreateDiscount, useDeleteDiscount } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Tag } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

const EMPTY_FORM = { code: "", type: "percent", value: "", minOrder: "", maxUses: "", expiresAt: "" };

export default function AdminDiscounts() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<typeof EMPTY_FORM>(EMPTY_FORM);

  const { data: discounts, isLoading } = useListDiscounts();
  const createDiscount = useCreateDiscount();
  const deleteDiscount = useDeleteDiscount();

  const handleCreate = () => {
    if (!form.code || !form.value) { toast({ title: "اطلاعات ناقص", variant: "destructive" }); return; }
    createDiscount.mutate({ data: { code: form.code.toUpperCase(), type: form.type as "percent" | "fixed", value: Number(form.value), minOrder: form.minOrder ? Number(form.minOrder) : null, maxUses: form.maxUses ? Number(form.maxUses) : null, expiresAt: form.expiresAt || null, isActive: true } }, {
      onSuccess: () => { toast({ title: "کد تخفیف ساخته شد" }); setDialogOpen(false); setForm(EMPTY_FORM); qc.invalidateQueries(); },
      onError: () => toast({ title: "خطا", variant: "destructive" }),
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black">مدیریت کدهای تخفیف</h1>
        <Button onClick={() => setDialogOpen(true)} className="rounded-full gap-2 font-bold"><Plus className="w-4 h-4" />کد جدید</Button>
      </div>

      <div className="grid gap-4">
        {isLoading ? <div className="h-24 rounded-2xl bg-muted animate-pulse" /> :
          (discounts || []).map((d) => (
            <div key={d.id} className="bg-card rounded-2xl p-5 border border-border/50 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Tag className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-black text-lg font-mono">{d.code}</p>
                <p className="text-sm text-muted-foreground">
                  {d.type === "percent" ? `${d.value}٪ تخفیف` : `${Number(d.value).toLocaleString("fa-IR")} تومان تخفیف`}
                  {d.minOrder && ` · حداقل ${Number(d.minOrder).toLocaleString("fa-IR")} تومان`}
                </p>
              </div>
              <div className="text-left shrink-0">
                <span className={`text-xs font-bold px-2 py-1 rounded-full ${d.isActive ? "bg-green-100 text-green-600" : "bg-muted text-muted-foreground"}`}>{d.isActive ? "فعال" : "غیرفعال"}</span>
                <p className="text-xs text-muted-foreground mt-1">{d.usedCount.toLocaleString("fa-IR")} بار استفاده</p>
              </div>
              <Button size="icon" variant="ghost" className="w-8 h-8 rounded-lg hover:bg-destructive/10 hover:text-destructive" onClick={() => { if (confirm("حذف شود؟")) deleteDiscount.mutate({ id: d.id }, { onSuccess: () => qc.invalidateQueries() }); }}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        {!isLoading && (!discounts || discounts.length === 0) && (
          <div className="text-center py-16 text-muted-foreground bg-muted/30 rounded-2xl">کد تخفیفی وجود ندارد</div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent dir="rtl">
          <DialogHeader><DialogTitle>کد تخفیف جدید</DialogTitle></DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            {[
              { k: "code", l: "کد تخفیف", p: "KOODAK20" },
              { k: "value", l: "مقدار", p: "20", t: "number" },
              { k: "minOrder", l: "حداقل خرید (تومان)", p: "500000", t: "number" },
              { k: "maxUses", l: "حداکثر استفاده", p: "100", t: "number" },
              { k: "expiresAt", l: "تاریخ انقضا", p: "", t: "date" },
            ].map(({ k, l, p, t }) => (
              <div key={k}>
                <label className="text-sm font-medium text-muted-foreground mb-1.5 block">{l}</label>
                <input type={t || "text"} value={(form as any)[k]} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))} placeholder={p}
                  className="h-10 w-full rounded-xl bg-muted border-none px-4 text-sm focus:outline-none" />
              </div>
            ))}
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1.5 block">نوع تخفیف</label>
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className="h-10 w-full rounded-xl bg-muted border-none px-4 text-sm focus:outline-none">
                <option value="percent">درصدی</option>
                <option value="fixed">مبلغ ثابت</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>انصراف</Button>
            <Button onClick={handleCreate} className="font-bold" disabled={createDiscount.isPending}>ایجاد</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
