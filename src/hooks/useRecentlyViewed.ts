import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'highlights-recent-views';
const MAX_ITEMS = 10;

export const useRecentlyViewed = () => {
  const [viewedIds, setViewedIds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(viewedIds));
  }, [viewedIds]);

  const addView = useCallback((productId: string) => {
    setViewedIds(prev => {
      const filtered = prev.filter(id => id !== productId);
      return [productId, ...filtered].slice(0, MAX_ITEMS);
    });
  }, []);

  return { viewedIds, addView };
};
