import { useState } from "react";
import { useListProducts, useDeleteProduct, useCreateProduct, useUpdateProduct } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

const EMPTY_FORM = { name: "", nameFa: "", slug: "", price: "", salePrice: "", categoryId: "", stock: "0", brand: "", ageGroup: "", descriptionFa: "", isFeatured: false, isFlashSale: false };

export default function AdminProducts() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<typeof EMPTY_FORM>(EMPTY_FORM);

  const { data, isLoading } = useListProducts({ page, limit: 15 });
  const deleteProduct = useDeleteProduct();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();

  const products = data?.products || [];
  const filtered = products.filter(p => p.nameFa.includes(search) || p.name.toLowerCase().includes(search.toLowerCase()));

  const openAdd = () => { setEditId(null); setForm(EMPTY_FORM); setDialogOpen(true); };
  const openEdit = (p: typeof products[0]) => {
    setEditId(p.id);
    setForm({ name: p.name, nameFa: p.nameFa, slug: p.slug, price: String(p.price), salePrice: p.salePrice ? String(p.salePrice) : "", categoryId: String(p.categoryId), stock: String(p.stock), brand: p.brand || "", ageGroup: p.ageGroup || "", descriptionFa: p.descriptionFa || "", isFeatured: p.isFeatured, isFlashSale: p.isFlashSale });
    setDialogOpen(true);
  };

  const handleSave = () => {
    const payload: any = { ...form, price: Number(form.price), salePrice: form.salePrice ? Number(form.salePrice) : null, categoryId: Number(form.categoryId), stock: Number(form.stock) };
    if (editId) {
      updateProduct.mutate({ id: editId, data: payload }, {
        onSuccess: () => { toast({ title: "محصول به‌روز شد" }); setDialogOpen(false); qc.invalidateQueries(); },
        onError: () => toast({ title: "خطا", variant: "destructive" }),
      });
    } else {
      createProduct.mutate({ data: payload }, {
        onSuccess: () => { toast({ title: "محصول اضافه شد" }); setDialogOpen(false); qc.invalidateQueries(); },
        onError: () => toast({ title: "خطا", variant: "destructive" }),
      });
    }
  };

  const handleDelete = (id: number) => {
    if (!confirm("آیا مطمئنید؟")) return;
    deleteProduct.mutate({ id }, {
      onSuccess: () => { toast({ title: "محصول حذف شد" }); qc.invalidateQueries(); },
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black">مدیریت محصولات</h1>
        <Button onClick={openAdd} className="rounded-full gap-2 font-bold"><Plus className="w-4 h-4" />افزودن محصول</Button>
      </div>

      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="جستجو..." className="h-10 w-full rounded-xl bg-card border border-border/50 pr-10 pl-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
      </div>

      <div className="bg-card rounded-2xl border border-border/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b border-border/50">
              <tr>
                <th className="text-right px-4 py-3 font-semibold text-muted-foreground">محصول</th>
                <th className="text-right px-4 py-3 font-semibold text-muted-foreground hidden md:table-cell">قیمت</th>
                <th className="text-right px-4 py-3 font-semibold text-muted-foreground hidden md:table-cell">موجودی</th>
                <th className="text-right px-4 py-3 font-semibold text-muted-foreground">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {isLoading ? Array(5).fill(0).map((_, i) => (
                <tr key={i}><td colSpan={4} className="px-4 py-3"><Skeleton className="h-6 w-full" /></td></tr>
              )) : filtered.map((p) => (
                <tr key={p.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-muted shrink-0">
                        {p.images[0] && <img src={p.images[0]} alt={p.nameFa} className="w-full h-full object-cover" />}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium truncate">{p.nameFa}</p>
                        <p className="text-xs text-muted-foreground">{p.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className="font-bold">{p.price.toLocaleString("fa-IR")}</span>
                    {p.salePrice && <span className="text-xs text-muted-foreground line-through mr-2">{p.salePrice.toLocaleString("fa-IR")}</span>}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${p.stock === 0 ? "bg-red-100 text-red-600" : p.stock < 5 ? "bg-orange-100 text-orange-600" : "bg-green-100 text-green-600"}`}>{p.stock.toLocaleString("fa-IR")}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Button size="icon" variant="ghost" onClick={() => openEdit(p)} className="w-8 h-8 rounded-lg hover:bg-primary/10 hover:text-primary"><Pencil className="w-3.5 h-3.5" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => handleDelete(p.id)} className="w-8 h-8 rounded-lg hover:bg-destructive/10 hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex justify-center gap-2">
        <Button variant="outline" className="rounded-full" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}>قبلی</Button>
        <span className="text-sm text-muted-foreground flex items-center">صفحه {page.toLocaleString("fa-IR")}</span>
        <Button variant="outline" className="rounded-full" onClick={() => setPage(p => p + 1)} disabled={(data?.totalPages || 1) <= page}>بعدی</Button>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg" dir="rtl">
          <DialogHeader><DialogTitle>{editId ? "ویرایش محصول" : "افزودن محصول"}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            {[
              { k: "nameFa", l: "نام فارسی" }, { k: "name", l: "نام انگلیسی" },
              { k: "slug", l: "slug" }, { k: "brand", l: "برند" },
              { k: "price", l: "قیمت (تومان)", t: "number" }, { k: "salePrice", l: "قیمت تخفیف (اختیاری)", t: "number" },
              { k: "categoryId", l: "شناسه دسته‌بندی", t: "number" }, { k: "stock", l: "موجودی", t: "number" },
              { k: "ageGroup", l: "گروه سنی" },
            ].map(({ k, l, t }) => (
              <div key={k} className={k === "nameFa" ? "col-span-2" : ""}>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">{l}</label>
                <input type={t || "text"} value={(form as any)[k]} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))}
                  className="h-9 w-full rounded-lg bg-muted border-none px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
              </div>
            ))}
            <div className="col-span-2">
              <label className="text-xs font-medium text-muted-foreground mb-1 block">توضیحات فارسی</label>
              <textarea value={form.descriptionFa} onChange={e => setForm(f => ({ ...f, descriptionFa: e.target.value }))} rows={2} className="w-full rounded-lg bg-muted border-none px-3 py-2 text-sm focus:outline-none resize-none" />
            </div>
            <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={form.isFeatured} onChange={e => setForm(f => ({ ...f, isFeatured: e.target.checked }))} /><span className="text-sm">محصول ویژه</span></label>
            <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={form.isFlashSale} onChange={e => setForm(f => ({ ...f, isFlashSale: e.target.checked }))} /><span className="text-sm">حراج زمان‌دار</span></label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>انصراف</Button>
            <Button onClick={handleSave} className="font-bold" disabled={createProduct.isPending || updateProduct.isPending}>{editId ? "به‌روزرسانی" : "افزودن"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
