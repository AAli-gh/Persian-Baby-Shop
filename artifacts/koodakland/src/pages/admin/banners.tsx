import { useState } from "react";
import { useListBanners, useCreateBanner, useDeleteBanner, useUpdateBanner } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Pencil, Image } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

const EMPTY = { titleFa: "", subtitleFa: "", image: "", link: "", position: "hero", sortOrder: "0" };

export default function AdminBanners() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<typeof EMPTY>(EMPTY);

  const { data: banners, isLoading } = useListBanners();
  const createBanner = useCreateBanner();
  const updateBanner = useUpdateBanner();
  const deleteBanner = useDeleteBanner();

  const openAdd = () => { setEditId(null); setForm(EMPTY); setDialogOpen(true); };
  const openEdit = (b: any) => { setEditId(b.id); setForm({ titleFa: b.titleFa || "", subtitleFa: b.subtitleFa || "", image: b.image, link: b.link || "", position: b.position, sortOrder: String(b.sortOrder) }); setDialogOpen(true); };

  const handleSave = () => {
    if (!form.image) { toast({ title: "تصویر الزامی است", variant: "destructive" }); return; }
    const payload: any = { ...form, sortOrder: Number(form.sortOrder), isActive: true };
    if (editId) {
      updateBanner.mutate({ id: editId, data: payload }, { onSuccess: () => { toast({ title: "بنر به‌روز شد" }); setDialogOpen(false); qc.invalidateQueries(); } });
    } else {
      createBanner.mutate({ data: payload }, { onSuccess: () => { toast({ title: "بنر اضافه شد" }); setDialogOpen(false); qc.invalidateQueries(); } });
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black">مدیریت بنرها</h1>
        <Button onClick={openAdd} className="rounded-full gap-2 font-bold"><Plus className="w-4 h-4" />بنر جدید</Button>
      </div>

      <div className="grid gap-4">
        {isLoading ? <div className="h-32 rounded-2xl bg-muted animate-pulse" /> : (banners || []).map((b: any) => (
          <div key={b.id} className="bg-card rounded-2xl border border-border/50 overflow-hidden flex items-center">
            <div className="w-32 h-20 shrink-0 bg-muted">
              {b.image ? <img src={b.image} alt={b.titleFa} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Image className="w-6 h-6 text-muted-foreground" /></div>}
            </div>
            <div className="flex-1 px-5">
              <p className="font-bold">{b.titleFa || "—"}</p>
              <p className="text-sm text-muted-foreground">{b.subtitleFa || "—"}</p>
              <p className="text-xs text-muted-foreground mt-1">موقعیت: {b.position}</p>
            </div>
            <div className="flex gap-2 px-4 shrink-0">
              <Button size="icon" variant="ghost" onClick={() => openEdit(b)} className="w-8 h-8 rounded-lg hover:bg-primary/10 hover:text-primary"><Pencil className="w-3.5 h-3.5" /></Button>
              <Button size="icon" variant="ghost" onClick={() => { if (confirm("حذف شود؟")) deleteBanner.mutate({ id: b.id }, { onSuccess: () => qc.invalidateQueries() }); }} className="w-8 h-8 rounded-lg hover:bg-destructive/10 hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></Button>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent dir="rtl">
          <DialogHeader><DialogTitle>{editId ? "ویرایش بنر" : "بنر جدید"}</DialogTitle></DialogHeader>
          <div className="flex flex-col gap-3 py-2">
            {[
              { k: "titleFa", l: "عنوان فارسی" }, { k: "subtitleFa", l: "زیرعنوان فارسی" },
              { k: "image", l: "تصویر (URL)" }, { k: "link", l: "لینک" },
              { k: "sortOrder", l: "ترتیب", t: "number" },
            ].map(({ k, l, t }) => (
              <div key={k}>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">{l}</label>
                <input type={t || "text"} value={(form as any)[k]} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))}
                  className="h-9 w-full rounded-lg bg-muted border-none px-3 text-sm focus:outline-none" />
              </div>
            ))}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">موقعیت</label>
              <select value={form.position} onChange={e => setForm(f => ({ ...f, position: e.target.value }))} className="h-9 w-full rounded-lg bg-muted border-none px-3 text-sm focus:outline-none">
                <option value="hero">هرو (صفحه اصلی)</option>
                <option value="sidebar">سایدبار</option>
                <option value="bottom">پایین صفحه</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>انصراف</Button>
            <Button onClick={handleSave} className="font-bold" disabled={createBanner.isPending || updateBanner.isPending}>{editId ? "به‌روزرسانی" : "ایجاد"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
