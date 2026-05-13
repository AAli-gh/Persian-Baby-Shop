import { useState } from "react";
import { useListBlogPosts, useCreateBlogPost, useDeleteBlogPost, useUpdateBlogPost } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

const EMPTY = { slug: "", title: "", titleFa: "", excerptFa: "", contentFa: "", content: "", coverImage: "", authorName: "", readingTime: "5", isPublished: true };

export default function AdminBlog() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editSlug, setEditSlug] = useState<string | null>(null);
  const [form, setForm] = useState<typeof EMPTY>(EMPTY);

  const { data, isLoading } = useListBlogPosts({});
  const createPost = useCreateBlogPost();
  const updatePost = useUpdateBlogPost();
  const deletePost = useDeleteBlogPost();

  const posts = data?.posts || [];

  const openAdd = () => { setEditSlug(null); setForm(EMPTY); setDialogOpen(true); };
  const openEdit = (p: typeof posts[0]) => {
    setEditSlug(p.slug);
    setForm({ slug: p.slug, title: p.title, titleFa: p.titleFa, excerptFa: p.excerptFa || "", contentFa: p.contentFa, content: p.content, coverImage: p.coverImage || "", authorName: p.authorName, readingTime: String(p.readingTime), isPublished: p.isPublished });
    setDialogOpen(true);
  };

  const handleSave = () => {
    const payload: any = { ...form, readingTime: Number(form.readingTime) };
    if (editSlug) {
      updatePost.mutate({ slug: editSlug, data: payload }, {
        onSuccess: () => { toast({ title: "مقاله به‌روز شد" }); setDialogOpen(false); qc.invalidateQueries(); },
        onError: () => toast({ title: "خطا", variant: "destructive" }),
      });
    } else {
      createPost.mutate({ data: payload }, {
        onSuccess: () => { toast({ title: "مقاله ایجاد شد" }); setDialogOpen(false); qc.invalidateQueries(); },
        onError: () => toast({ title: "خطا", variant: "destructive" }),
      });
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black">مدیریت وبلاگ</h1>
        <Button onClick={openAdd} className="rounded-full gap-2 font-bold"><Plus className="w-4 h-4" />مقاله جدید</Button>
      </div>

      <div className="flex flex-col gap-4">
        {isLoading ? Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-20 rounded-2xl" />) :
          posts.map((post) => (
            <div key={post.id} className="bg-card rounded-2xl p-5 border border-border/50 flex items-center gap-4">
              {post.coverImage && <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0"><img src={post.coverImage} alt={post.titleFa} className="w-full h-full object-cover" /></div>}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-bold truncate">{post.titleFa}</p>
                  <Badge variant={post.isPublished ? "default" : "secondary"} className="text-xs rounded-full shrink-0">{post.isPublished ? "منتشر" : "پیش‌نویس"}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">{post.authorName} · {post.readingTime.toLocaleString("fa-IR")} دقیقه</p>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button size="icon" variant="ghost" onClick={() => openEdit(post)} className="w-8 h-8 rounded-lg hover:bg-primary/10 hover:text-primary"><Pencil className="w-3.5 h-3.5" /></Button>
                <Button size="icon" variant="ghost" onClick={() => { if (confirm("حذف شود؟")) deletePost.mutate({ slug: post.slug }, { onSuccess: () => qc.invalidateQueries() }); }} className="w-8 h-8 rounded-lg hover:bg-destructive/10 hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></Button>
              </div>
            </div>
          ))}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-xl max-h-[80vh] overflow-y-auto" dir="rtl">
          <DialogHeader><DialogTitle>{editSlug ? "ویرایش مقاله" : "مقاله جدید"}</DialogTitle></DialogHeader>
          <div className="flex flex-col gap-3 py-2">
            {[
              { k: "titleFa", l: "عنوان فارسی" }, { k: "title", l: "عنوان انگلیسی" },
              { k: "slug", l: "slug" }, { k: "authorName", l: "نام نویسنده" },
              { k: "coverImage", l: "تصویر کاور (URL)" }, { k: "readingTime", l: "زمان مطالعه (دقیقه)", t: "number" },
            ].map(({ k, l, t }) => (
              <div key={k}>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">{l}</label>
                <input type={t || "text"} value={(form as any)[k]} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))}
                  className="h-9 w-full rounded-lg bg-muted border-none px-3 text-sm focus:outline-none" />
              </div>
            ))}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">خلاصه فارسی</label>
              <textarea value={form.excerptFa} onChange={e => setForm(f => ({ ...f, excerptFa: e.target.value }))} rows={2} className="w-full rounded-lg bg-muted border-none px-3 py-2 text-sm focus:outline-none resize-none" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">محتوا فارسی</label>
              <textarea value={form.contentFa} onChange={e => setForm(f => ({ ...f, contentFa: e.target.value }))} rows={6} className="w-full rounded-lg bg-muted border-none px-3 py-2 text-sm focus:outline-none resize-none" />
            </div>
            <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={form.isPublished} onChange={e => setForm(f => ({ ...f, isPublished: e.target.checked }))} /><span className="text-sm">منتشر شود</span></label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>انصراف</Button>
            <Button onClick={handleSave} className="font-bold" disabled={createPost.isPending || updatePost.isPending}>{editSlug ? "به‌روزرسانی" : "ایجاد"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
