import { useState } from "react";
import { Link } from "wouter";
import { useListBlogPosts, useListBlogCategories } from "@workspace/api-client-react";
import { useSEO } from "@/hooks/useSEO";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Clock, Eye } from "lucide-react";

export default function Blog() {
  useSEO({
    title: "وبلاگ کودک‌لند — مقالات تخصصی پرورش کودک",
    description: "آخرین مقالات تخصصی در مورد سلامت، تغذیه، بازی و رشد کودک. راهنمای کامل والدین ایرانی.",
    keywords: "وبلاگ کودک، مقاله کودک، پرورش کودک، سلامت نوزاد",
    type: "article",
  });
  const [selectedCat, setSelectedCat] = useState("");
  const { data, isLoading } = useListBlogPosts({ category: selectedCat || undefined, published: true });
  const { data: cats } = useListBlogCategories();

  const posts = data?.posts || [];

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-black mb-2">وبلاگ کودک‌لند</h1>
          <p className="text-muted-foreground">مطالب آموزشی برای والدین</p>
        </div>

        <div className="flex flex-wrap gap-2 justify-center mb-8">
          <button onClick={() => setSelectedCat("")} className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${!selectedCat ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80 text-foreground"}`}>همه</button>
          {cats?.map((cat) => (
            <button key={cat.id} onClick={() => setSelectedCat(cat.slug)} className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${selectedCat === cat.slug ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80 text-foreground"}`}>{cat.nameFa}</button>
          ))}
        </div>

        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-64 rounded-3xl" />)}
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">مطلبی یافت نشد</div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
              <Link key={post.id} href={`/blog/${post.slug}`}>
                <article className="bg-card rounded-3xl overflow-hidden border border-border/50 shadow-sm hover:shadow-md transition-all hover:-translate-y-1 group cursor-pointer h-full flex flex-col">
                  {post.coverImage && (
                    <div className="aspect-video overflow-hidden">
                      <img src={post.coverImage} alt={post.titleFa} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    </div>
                  )}
                  <div className="p-5 flex flex-col gap-3 flex-1">
                    {post.categoryName && <Badge variant="secondary" className="rounded-full text-xs w-fit">{post.categoryName}</Badge>}
                    <h2 className="font-black text-lg leading-tight group-hover:text-primary transition-colors">{post.titleFa}</h2>
                    {post.excerptFa && <p className="text-muted-foreground text-sm line-clamp-2 leading-relaxed">{post.excerptFa}</p>}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mt-auto pt-3 border-t border-border/50">
                      <span className="font-medium">{post.authorName}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{post.readingTime.toLocaleString("fa-IR")} دقیقه</span>
                      <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{post.viewCount.toLocaleString("fa-IR")}</span>
                    </div>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
