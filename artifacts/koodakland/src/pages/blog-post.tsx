import { useRoute, Link } from "wouter";
import { useGetBlogPost } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Clock, Eye, ArrowRight } from "lucide-react";

export default function BlogPost() {
  const [, params] = useRoute("/blog/:slug");
  const slug = params?.slug || "";
  const { data: post, isLoading } = useGetBlogPost(slug, { query: { enabled: !!slug, queryKey: ["blog-post", slug] } });

  if (isLoading) return (
    <div className="container mx-auto px-4 py-8 max-w-3xl" dir="rtl">
      <Skeleton className="h-64 rounded-3xl mb-6" />
      <Skeleton className="h-8 w-3/4 mb-4" />
      <Skeleton className="h-4 w-full mb-2" />
      <Skeleton className="h-4 w-full mb-2" />
      <Skeleton className="h-4 w-2/3" />
    </div>
  );

  if (!post) return (
    <div className="container mx-auto px-4 py-24 text-center" dir="rtl">
      <p className="font-bold text-lg">مطلب یافت نشد</p>
      <Link href="/blog" className="text-primary hover:underline mt-4 inline-block">بازگشت به وبلاگ</Link>
    </div>
  );

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <Link href="/blog" className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-6 text-sm font-medium">
          <ArrowRight className="w-4 h-4" /> بازگشت به وبلاگ
        </Link>

        {post.coverImage && (
          <div className="aspect-video rounded-3xl overflow-hidden mb-8">
            <img src={post.coverImage} alt={post.titleFa} className="w-full h-full object-cover" />
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3 mb-4">
          {post.categoryName && <Badge variant="secondary" className="rounded-full">{post.categoryName}</Badge>}
          <span className="flex items-center gap-1 text-xs text-muted-foreground"><Clock className="w-3 h-3" />{post.readingTime.toLocaleString("fa-IR")} دقیقه مطالعه</span>
          <span className="flex items-center gap-1 text-xs text-muted-foreground"><Eye className="w-3 h-3" />{post.viewCount.toLocaleString("fa-IR")} بازدید</span>
        </div>

        <h1 className="text-2xl md:text-3xl font-black text-foreground mb-3 leading-tight">{post.titleFa}</h1>
        <p className="text-muted-foreground text-sm mb-8">نوشته {post.authorName}</p>

        <div className="prose prose-slate dark:prose-invert max-w-none text-foreground leading-loose">
          {post.contentFa.split("\n").map((paragraph, i) => (
            <p key={i} className="mb-4 text-base leading-relaxed text-foreground/90">{paragraph}</p>
          ))}
        </div>

        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-8 pt-6 border-t border-border/50">
            {post.tags.map((tag) => (
              <Badge key={tag} variant="outline" className="rounded-full text-xs">{tag}</Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
