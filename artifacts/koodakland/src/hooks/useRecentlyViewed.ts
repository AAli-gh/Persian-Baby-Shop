import { useState, useEffect, useCallback } from "react";

const KEY = "kl_recently_viewed";
const MAX = 10;

export interface RecentlyViewedItem {
  id: number;
  nameFa: string;
  slug: string;
  price: number;
  salePrice: number | null;
  images: string[];
}

export function useRecentlyViewed() {
  const [items, setItems] = useState<RecentlyViewedItem[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(KEY) || "[]");
    } catch {
      return [];
    }
  });

  const addItem = useCallback((item: RecentlyViewedItem) => {
    setItems(prev => {
      const filtered = prev.filter(p => p.id !== item.id);
      const next = [item, ...filtered].slice(0, MAX);
      localStorage.setItem(KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const clearItems = useCallback(() => {
    localStorage.removeItem(KEY);
    setItems([]);
  }, []);

  return { items, addItem, clearItems };
}
