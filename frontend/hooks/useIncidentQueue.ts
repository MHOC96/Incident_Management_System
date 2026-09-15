"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api";
import type { PaginatedResponse } from "@/types";

export function useIncidentQueue<K extends string, T>(paths: Record<K, string>, initial: K, loadCounts = true) {
  const [selection, setSelection] = useState({ view: initial, page: 1 });
  const [counts, setCounts] = useState<Record<K, number>>(() =>
    Object.fromEntries(Object.keys(paths).map(key => [key, 0])) as Record<K, number>);
  const [state, setState] = useState<{ key: string; items: T[]; count: number; error: string }>({
    key: "", items: [], count: 0, error: "",
  });
  const key = `${selection.view}:${selection.page}`;
  useEffect(() => {
    if (!loadCounts) return;
    const controller = new AbortController();
    void apiClient.get<Record<K, number>>("/incidents/queue-counts/", { signal: controller.signal })
      .then(setCounts).catch(() => { /* The active queue still supplies its accurate count. */ });
    return () => controller.abort();
  }, [loadCounts]);
  useEffect(() => {
    const controller = new AbortController();
    void apiClient.get<PaginatedResponse<T>>(`${paths[selection.view]}?page=${selection.page}`, { signal: controller.signal })
      .then(data => {
        if (controller.signal.aborted) return;
        setState({ key, items: data.results, count: data.count, error: "" });
        setCounts(current => ({ ...current, [selection.view]: data.count }));
      }).catch(() => {
        if (!controller.signal.aborted) setState({ key, items: [], count: 0, error: "We couldn't load this queue. Please refresh to try again." });
      });
    return () => controller.abort();
  }, [paths, selection, key]);
  return {
    activeView: selection.view, page: selection.page, counts,
    items: state.key === key ? state.items : [], count: state.count,
    isLoading: state.key !== key, error: state.key === key ? state.error : "",
    setActiveView: (view: K) => setSelection({ view, page: 1 }),
    setPage: (page: number) => setSelection(current => ({ ...current, page })),
  };
}
