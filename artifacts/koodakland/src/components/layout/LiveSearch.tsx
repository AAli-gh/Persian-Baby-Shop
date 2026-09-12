import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useLocation } from "wouter";
import { Search, X, TrendingUp, ArrowLeft, Package } from "lucide-react";
import { useSearchProducts } from "@workspace/api-client-react";

function formatPrice(n: number) {
  return new Intl.NumberFormat("fa-IR").format(n) + " تومان";
}

const POPULAR = ["لباس نوزاد", "اسباب‌بازی", "کفش کودک", "کتاب کودک", "کارو"];

interface SearchResult {
  id: number;
  nameFa: string;
  slug: string;
  price: number;
  salePrice?: number | null;
  images: string[];
  categoryName?: string | null;
}

interface DropdownProps {
  results: SearchResult[];
  categories: { nameFa: string; slug: string; productCount: number }[];
  query: string;
  total: number;
  isLoading: boolean;
  onClose: () => void;
}

function ResultsDropdown({ results, categories, query, total, isLoading, onClose }: DropdownProps) {
  const [, navigate] = useLocation();

  const handleProductClick = (slug: string) => {
    navigate(`/product/${slug}`);
    onClose();
  };

  const handleViewAll = () => {
    navigate(`/shop?q=${encodeURIComponent(query)}`);
    onClose();
  };

  return (
    <div
      className="absolute top-[calc(100%+8px)] right-0 left-0 z-[200] rounded-2xl shadow-2xl border border-pink-100/60 overflow-hidden"
      style={{
        background: "rgba(255,255,255,0.97)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
      }}
    >
      {isLoading ? (
        <div className="flex items-center justify-center gap-3 py-8">
          <div className="w-5 h-5 rounded-full border-2 border-pink-400 border-t-transparent animate-spin" />
          <span className="text-sm text-muted-foreground">در حال جستجو...</span>
        </div>
      ) : results.length === 0 && query.length > 1 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-8 text-center px-4">
          <div className="w-12 h-12 rounded-full bg-pink-50 flex items-center justify-center">
            <Package className="w-6 h-6 text-pink-300" />
          </div>
          <p className="text-sm font-medium text-foreground">نتیجه‌ای یافت نشد</p>
          <p className="text-xs text-muted-foreground">برای «{query}» محصولی پیدا نشد</p>
        </div>
      ) : (
        <>
          {results.length > 0 && (
            <div>
              <div className="px-4 pt-3 pb-1 flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">محصولات</span>
                <span className="text-xs text-muted-foreground">{total} نتیجه</span>
              </div>
              <ul>
                {results.slice(0, 6).map((p) => (
                  <li key={p.id}>
                    <button
                      onClick={() => handleProductClick(p.slug)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-pink-50/80 transition-colors text-right group"
                    >
                      <div className="w-12 h-12 rounded-xl overflow-hidden bg-pink-50 flex-shrink-0 border border-pink-100">
                        {p.images[0] ? (
                          <img
                            src={p.images[0]}
                            alt={p.nameFa}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="w-5 h-5 text-pink-200" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0 text-right">
                        <p className="text-sm font-semibold text-foreground truncate">{p.nameFa}</p>
                        {p.categoryName && (
                          <p className="text-xs text-muted-foreground mt-0.5">{p.categoryName}</p>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          {p.salePrice ? (
                            <>
                              <span className="text-sm font-bold text-primary">{formatPrice(p.salePrice)}</span>
                              <span className="text-xs text-muted-foreground line-through">{formatPrice(p.price)}</span>
                            </>
                          ) : (
                            <span className="text-sm font-bold text-foreground">{formatPrice(p.price)}</span>
                          )}
                        </div>
                      </div>
                      <ArrowLeft className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 -rotate-180 transition-all flex-shrink-0" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {categories.length > 0 && (
            <div className="border-t border-pink-50 px-4 pt-3 pb-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">دسته‌بندی</span>
              <div className="flex flex-wrap gap-2 mt-2">
                {categories.slice(0, 4).map((c) => (
                  <button
                    key={c.slug}
                    onClick={() => {
                      navigate(`/shop?category=${c.slug}`);
                      onClose();
                    }}
                    className="px-3 py-1.5 rounded-full text-xs font-medium bg-pink-50 text-pink-700 hover:bg-pink-100 transition-colors border border-pink-100"
                  >
                    {c.nameFa} ({c.productCount})
                  </button>
                ))}
              </div>
            </div>
          )}

          {query.length > 1 && total > 6 && (
            <div className="border-t border-pink-50">
              <button
                onClick={handleViewAll}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-primary hover:bg-pink-50/60 transition-colors"
              >
                مشاهده همه {total} نتیجه
                <ArrowLeft className="w-4 h-4 -rotate-180" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function PopularTerms({ onSelect }: { onSelect: (t: string) => void }) {
  return (
    <div
      className="absolute top-[calc(100%+8px)] right-0 left-0 z-[200] rounded-2xl shadow-2xl border border-pink-100/60 overflow-hidden"
      style={{
        background: "rgba(255,255,255,0.97)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
      }}
    >
      <div className="px-4 pt-3 pb-1 flex items-center gap-2">
        <TrendingUp className="w-4 h-4 text-pink-400" />
        <span className="text-xs font-semibold text-muted-foreground">جستجوهای پرطرفدار</span>
      </div>
      <ul className="pb-2">
        {POPULAR.map((term) => (
          <li key={term}>
            <button
              onClick={() => onSelect(term)}
              className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-pink-50/80 transition-colors text-right"
            >
              <Search className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
              <span className="text-sm text-foreground">{term}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function DesktopSearch() {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const { data, isFetching } = useSearchProducts(
    { q: debouncedQuery, limit: 8 },
    { query: { queryKey: ["live-search", debouncedQuery], enabled: debouncedQuery.length > 1 } }
  );

  const showDropdown = open && (debouncedQuery.length > 1 || query.length === 0);

  return (
    <div ref={containerRef} className="relative flex-1 max-w-lg">
      <div
        className={`relative flex items-center transition-all duration-300 ${open ? "ring-2 ring-primary/30 shadow-lg shadow-primary/10" : "ring-1 ring-pink-100"} rounded-2xl overflow-hidden`}
        style={{
          background: "rgba(255,248,252,0.85)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
        }}
      >
        <Search className="absolute right-4 w-4 h-4 text-pink-400 pointer-events-none z-10" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setOpen(true)}
          placeholder="جستجو در کودک‌لند..."
          className="w-full h-11 bg-transparent pr-11 pl-4 text-sm placeholder:text-pink-300 text-foreground focus:outline-none"
          dir="rtl"
        />
        {query && (
          <button
            onClick={() => { setQuery(""); setDebouncedQuery(""); inputRef.current?.focus(); }}
            className="absolute left-3 p-1 rounded-full hover:bg-pink-100 transition-colors"
          >
            <X className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
        )}
      </div>

      {showDropdown && (
        <div className="animate-in fade-in slide-in-from-top-2 duration-200">
          {debouncedQuery.length > 1 ? (
            <ResultsDropdown
              results={data?.products ?? []}
              categories={data?.categories ?? []}
              query={debouncedQuery}
              total={data?.total ?? 0}
              isLoading={isFetching}
              onClose={() => { setOpen(false); setQuery(""); setDebouncedQuery(""); }}
            />
          ) : (
            <PopularTerms onSelect={(t) => { setQuery(t); inputRef.current?.focus(); }} />
          )}
        </div>
      )}
    </div>
  );
}

export function MobileSearchModal() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const [, navigate] = useLocation();

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      setQuery("");
      setDebouncedQuery("");
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, []);

  const { data, isFetching } = useSearchProducts(
    { q: debouncedQuery, limit: 8 },
    { query: { queryKey: ["live-search-mobile", debouncedQuery], enabled: debouncedQuery.length > 1 } }
  );

  const handleClose = useCallback(() => setOpen(false), []);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="relative flex items-center justify-center w-10 h-10 rounded-full transition-all duration-200 hover:bg-pink-50"
        style={{
          background: "rgba(255,228,240,0.6)",
          backdropFilter: "blur(8px)",
        }}
        aria-label="جستجو"
      >
        <Search className="w-4.5 h-4.5 text-pink-500" style={{ width: 18, height: 18 }} />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[300] flex flex-col"
          style={{
            background: "rgba(255,240,248,0.97)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
          }}
        >
          <div className="flex items-center gap-3 px-4 pt-safe pt-4 pb-3 border-b border-pink-100">
            <button
              onClick={handleClose}
              className="p-2 rounded-full hover:bg-pink-100 transition-colors flex-shrink-0"
            >
              <X className="w-5 h-5 text-foreground" />
            </button>

            <div
              className="flex-1 flex items-center gap-2 px-4 h-11 rounded-2xl ring-2 ring-primary/30"
              style={{ background: "rgba(255,255,255,0.9)" }}
            >
              <Search className="w-4 h-4 text-pink-400 flex-shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="جستجو کنید..."
                className="flex-1 bg-transparent text-sm placeholder:text-pink-300 text-foreground focus:outline-none text-right"
                dir="rtl"
              />
              {query && (
                <button onClick={() => { setQuery(""); setDebouncedQuery(""); }}>
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4">
            {debouncedQuery.length > 1 ? (
              isFetching ? (
                <div className="flex items-center justify-center gap-3 py-12">
                  <div className="w-6 h-6 rounded-full border-2 border-pink-400 border-t-transparent animate-spin" />
                  <span className="text-sm text-muted-foreground">در حال جستجو...</span>
                </div>
              ) : (data?.products ?? []).length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
                  <div className="w-16 h-16 rounded-full bg-pink-100 flex items-center justify-center">
                    <Package className="w-8 h-8 text-pink-300" />
                  </div>
                  <p className="font-medium text-foreground">نتیجه‌ای یافت نشد</p>
                  <p className="text-sm text-muted-foreground">برای «{debouncedQuery}» محصولی پیدا نشد</p>
                </div>
              ) : (
                <div>
                  <p className="text-xs text-muted-foreground mb-3">{data?.total ?? 0} نتیجه یافت شد</p>
                  <div className="flex flex-col gap-3">
                    {(data?.products ?? []).map((p) => (
                      <button
                        key={p.id}
                        onClick={() => { navigate(`/product/${p.slug}`); handleClose(); }}
                        className="flex items-center gap-4 p-3 rounded-2xl bg-white/80 border border-pink-100 hover:border-primary/40 hover:shadow-md transition-all text-right"
                      >
                        <div className="w-16 h-16 rounded-xl overflow-hidden bg-pink-50 flex-shrink-0 border border-pink-100">
                          {p.images[0] ? (
                            <img src={p.images[0]} alt={p.nameFa} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="w-7 h-7 text-pink-200" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-foreground text-sm truncate">{p.nameFa}</p>
                          {p.categoryName && (
                            <p className="text-xs text-muted-foreground mt-0.5">{p.categoryName}</p>
                          )}
                          <div className="flex items-center gap-2 mt-2">
                            {p.salePrice ? (
                              <>
                                <span className="text-sm font-bold text-primary">{formatPrice(p.salePrice)}</span>
                                <span className="text-xs text-muted-foreground line-through">{formatPrice(p.price)}</span>
                              </>
                            ) : (
                              <span className="text-sm font-bold text-foreground">{formatPrice(p.price)}</span>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>

                  {(data?.total ?? 0) > 6 && (
                    <button
                      onClick={() => { navigate(`/shop?q=${encodeURIComponent(debouncedQuery)}`); handleClose(); }}
                      className="w-full mt-4 py-3 rounded-2xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
                    >
                      مشاهده همه {data?.total} نتیجه
                    </button>
                  )}
                </div>
              )
            ) : (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="w-4 h-4 text-pink-400" />
                  <span className="text-sm font-semibold text-foreground">جستجوهای پرطرفدار</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {POPULAR.map((term) => (
                    <button
                      key={term}
                      onClick={() => setQuery(term)}
                      className="px-4 py-2 rounded-full text-sm font-medium bg-white/80 border border-pink-100 text-foreground hover:bg-pink-50 hover:border-pink-200 transition-colors"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
