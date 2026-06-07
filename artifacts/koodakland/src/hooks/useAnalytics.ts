declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

const GA_ID = import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined;

function gtag(...args: unknown[]) {
  if (typeof window === "undefined") return;
  if (!GA_ID) return;
  window.dataLayer = window.dataLayer || [];
  if (window.gtag) {
    window.gtag(...args);
  }
}

export function useAnalytics() {
  const trackPageView = (path: string, title?: string) => {
    gtag("event", "page_view", { page_path: path, page_title: title });
  };

  const trackProductView = (product: { id: number; nameFa: string; price: number; categoryName?: string | null }) => {
    gtag("event", "view_item", {
      currency: "IRR",
      value: product.price,
      items: [{
        item_id: String(product.id),
        item_name: product.nameFa,
        item_category: product.categoryName ?? "uncategorized",
        price: product.price,
      }],
    });
  };

  const trackAddToCart = (product: { id: number; nameFa: string; price: number }, quantity = 1) => {
    gtag("event", "add_to_cart", {
      currency: "IRR",
      value: product.price * quantity,
      items: [{
        item_id: String(product.id),
        item_name: product.nameFa,
        price: product.price,
        quantity,
      }],
    });
  };

  const trackBeginCheckout = (total: number, items: Array<{ id: number; nameFa: string; price: number; quantity: number }>) => {
    gtag("event", "begin_checkout", {
      currency: "IRR",
      value: total,
      items: items.map(i => ({
        item_id: String(i.id),
        item_name: i.nameFa,
        price: i.price,
        quantity: i.quantity,
      })),
    });
  };

  const trackPurchase = (orderId: string, total: number, items: Array<{ id: number; nameFa: string; price: number; quantity: number }>) => {
    gtag("event", "purchase", {
      transaction_id: orderId,
      currency: "IRR",
      value: total,
      items: items.map(i => ({
        item_id: String(i.id),
        item_name: i.nameFa,
        price: i.price,
        quantity: i.quantity,
      })),
    });
  };

  const trackSearch = (query: string) => {
    gtag("event", "search", { search_term: query });
  };

  const trackWishlist = (product: { id: number; nameFa: string }) => {
    gtag("event", "add_to_wishlist", { item_id: String(product.id), item_name: product.nameFa });
  };

  return { trackPageView, trackProductView, trackAddToCart, trackBeginCheckout, trackPurchase, trackSearch, trackWishlist };
}

export function injectGA(measurementId: string) {
  if (document.getElementById("ga-script")) return;
  const script = document.createElement("script");
  script.id = "ga-script";
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  document.head.appendChild(script);
  window.dataLayer = window.dataLayer || [];
  window.gtag = function (...args: unknown[]) { window.dataLayer!.push(args); };
  window.gtag("js", new Date());
  window.gtag("config", measurementId, { page_path: window.location.pathname });
}
