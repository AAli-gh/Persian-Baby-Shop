import { useState } from "react";
import { useListCategories, useCreateCategory, useUpdateCategory, useDeleteCategory } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

const EMPTY = { name: "", nameFa: "", slug: "", color: "#FFB3C6" };

export default function AdminCategories() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<typeof EMPTY>(EMPTY);

  const { data: categories } = useListCategories();
  const createCat = useCreateCategory();
  const updateCat = useUpdateCategory();
  const deleteCat = useDeleteCategory();

  const openEdit = (c: any) => { setEditId(c.id); setForm({ name: c.name, nameFa: c.nameFa, slug: c.slug, color: c.color || "#FFB3C6" }); setDialogOpen(true); };

  const handleSave = () => {
    if (editId) {
      updateCat.mutate({ id: editId, data: form }, { onSuccess: () => { toast({ title: "دسته‌بندی به‌روز شد" }); setDialogOpen(false); qc.invalidateQueries(); } });
    } else {
      createCat.mutate({ data: form }, { onSuccess: () => { toast({ title: "دسته‌بندی ایجاد شد" }); setDialogOpen(false); qc.invalidateQueries(); } });
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black">مدیریت دسته‌بندی‌ها</h1>
        <Button onClick={() => { setEditId(null); setForm(EMPTY); setDialogOpen(true); }} className="rounded-full gap-2 font-bold"><Plus className="w-4 h-4" />دسته‌بندی جدید</Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {(categories || []).map((cat) => (
          <div key={cat.id} className="bg-card rounded-2xl p-5 border border-border/50 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl shrink-0 flex items-center justify-center" style={{ backgroundColor: cat.color || "#FFB3C6" }}>
              <span className="text-xl">📦</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold truncate">{cat.nameFa}</p>
              <p className="text-xs text-muted-foreground">{cat.productCount.toLocaleString("fa-IR")} محصول</p>
            </div>
            <div className="flex gap-1 shrink-0">
              <Button size="icon" variant="ghost" onClick={() => openEdit(cat)} className="w-7 h-7 rounded-lg hover:bg-primary/10 hover:text-primary"><Pencil className="w-3 h-3" /></Button>
              <Button size="icon" variant="ghost" onClick={() => { if (confirm("حذف شود؟")) deleteCat.mutate({ id: cat.id }, { onSuccess: () => qc.invalidateQueries() }); }} className="w-7 h-7 rounded-lg hover:bg-destructive/10 hover:text-destructive"><Trash2 className="w-3 h-3" /></Button>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent dir="rtl">
          <DialogHeader><DialogTitle>{editId ? "ویرایش دسته‌بندی" : "دسته‌بندی جدید"}</DialogTitle></DialogHeader>
          <div className="flex flex-col gap-3 py-2">
            {[{ k: "nameFa", l: "نام فارسی" }, { k: "name", l: "نام انگلیسی" }, { k: "slug", l: "slug" }].map(({ k, l }) => (
              <div key={k}>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">{l}</label>
                <input value={(form as any)[k]} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))} className="h-9 w-full rounded-lg bg-muted border-none px-3 text-sm focus:outline-none" />
              </div>
            ))}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">رنگ</label>
              <input type="color" value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))} className="h-9 w-full rounded-lg cursor-pointer" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>انصراف</Button>
            <Button onClick={handleSave} className="font-bold" disabled={createCat.isPending || updateCat.isPending}>{editId ? "به‌روزرسانی" : "ایجاد"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
