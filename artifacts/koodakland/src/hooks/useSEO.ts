import { useEffect } from "react";

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: "website" | "product" | "article";
  jsonLd?: object;
  keywords?: string;
}

const SITE_NAME = "کودک‌لند";
const DEFAULT_DESCRIPTION = "بهترین فروشگاه آنلاین محصولات کودک در ایران. لباس، اسباب‌بازی، تغذیه و لوازم نوزاد با کیفیت تضمین‌شده.";
const DEFAULT_IMAGE = "/og-image.png";

function setMeta(name: string, content: string, prop = false) {
  const attr = prop ? "property" : "name";
  let el = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function setJsonLd(data: object) {
  let el = document.getElementById("__json_ld") as HTMLScriptElement | null;
  if (!el) {
    el = document.createElement("script");
    el.id = "__json_ld";
    el.type = "application/ld+json";
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(data);
}

export function useSEO({ title, description, image, url, type = "website", jsonLd, keywords }: SEOProps) {
  useEffect(() => {
    const fullTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} — فروشگاه محصولات کودک`;
    const desc = description || DEFAULT_DESCRIPTION;
    const img = image || DEFAULT_IMAGE;
    const pageUrl = url || window.location.href;

    document.title = fullTitle;

    setMeta("description", desc);
    if (keywords) setMeta("keywords", keywords);
    setMeta("robots", "index, follow");

    setMeta("og:title", fullTitle, true);
    setMeta("og:description", desc, true);
    setMeta("og:image", img, true);
    setMeta("og:url", pageUrl, true);
    setMeta("og:type", type, true);
    setMeta("og:site_name", SITE_NAME, true);
    setMeta("og:locale", "fa_IR", true);

    setMeta("twitter:card", "summary_large_image");
    setMeta("twitter:title", fullTitle);
    setMeta("twitter:description", desc);
    setMeta("twitter:image", img);

    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
    }
    canonical.href = pageUrl;

    if (jsonLd) setJsonLd(jsonLd);

    return () => {
      const script = document.getElementById("__json_ld");
      if (script) script.textContent = "";
    };
  }, [title, description, image, url, type, keywords, jsonLd]);
}
