"use client";

import { useEffect, useRef, useState } from "react";
import { apiClient } from "@/lib/api";
import type { PaginatedResponse } from "@/types";

export type QueueFilters = Record<string, string>;

export type UseIncidentQueueOptions<K extends string> = {
  /** Load queue-counts first, then open the tab with work (avoids a wasted list fetch). */
  resolveInitialView?: (counts: Record<K, number>) => K;
};

export function buildFilterQuery(filters: QueueFilters): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value.trim()) {
      params.set(key, value.trim());
    }
  }
  const query = params.toString();
  return query ? `?${query}` : "";
}

function buildQueueQuery(page: number, filters: QueueFilters): string {
  const params = new URLSearchParams({ page: String(page) });
  for (const [key, value] of Object.entries(filters)) {
    if (value.trim()) {
      params.set(key, value.trim());
    }
  }
  const query = params.toString();
  return query ? `?${query}` : "";
}

export function useIncidentQueue<K extends string, T>(
  paths: Record<K, string>,
  initial: K,
  loadCounts = true,
  filters: QueueFilters = {},
  options: UseIncidentQueueOptions<K> = {},
) {
  const { resolveInitialView } = options;
  const bootstrapFromCounts = Boolean(loadCounts && resolveInitialView);
  const [listReady, setListReady] = useState(!bootstrapFromCounts);
  const initialViewBootstrappedRef = useRef(false);

  const [selection, setSelection] = useState({ view: initial, page: 1 });
  const [counts, setCounts] = useState<Record<K, number>>(() =>
    Object.fromEntries(Object.keys(paths).map((key) => [key, 0])) as Record<K, number>);
  const [state, setState] = useState<{ key: string; items: T[]; count: number; error: string }>({
    key: "",
    items: [],
    count: 0,
    error: "",
  });
  const [viewItemsCache, setViewItemsCache] = useState<Partial<Record<K, T[]>>>({});
  const viewItemsCacheRef = useRef<Partial<Record<K, T[]>>>({});
  const filterKey = JSON.stringify(filters);
  const key = `${selection.view}:${selection.page}:${filterKey}`;

  useEffect(() => {
    if (!loadCounts) {
      return;
    }
    const controller = new AbortController();
    const loadAllCounts = () => {
      void apiClient
        .get<Record<K, number>>(`/incidents/queue-counts/${buildFilterQuery(filters)}`, {
          signal: controller.signal,
        })
        .then((data) => {
          if (controller.signal.aborted) {
            return;
          }
          setCounts(data);
          if (resolveInitialView && !initialViewBootstrappedRef.current) {
            initialViewBootstrappedRef.current = true;
            setSelection({ view: resolveInitialView(data), page: 1 });
            setListReady(true);
          }
        })
        .catch(() => {
          if (!controller.signal.aborted && bootstrapFromCounts && !initialViewBootstrappedRef.current) {
            initialViewBootstrappedRef.current = true;
            setListReady(true);
          }
        });
    };
    if (bootstrapFromCounts) {
      loadAllCounts();
      return () => controller.abort();
    }
    if (typeof requestIdleCallback === "function") {
      const idleId = requestIdleCallback(loadAllCounts, { timeout: 2000 });
      return () => {
        controller.abort();
        cancelIdleCallback(idleId);
      };
    }
    loadAllCounts();
    return () => controller.abort();
  }, [loadCounts, filterKey, filters, bootstrapFromCounts, resolveInitialView]);

  useEffect(() => {
    if (!listReady) {
      return;
    }
    const controller = new AbortController();
    void apiClient
      .get<PaginatedResponse<T>>(
        `${paths[selection.view]}${buildQueueQuery(selection.page, filters)}`,
        {
          signal: controller.signal,
        },
      )
      .then((data) => {
        if (controller.signal.aborted) return;
        viewItemsCacheRef.current[selection.view] = data.results;
        setViewItemsCache((current) => ({ ...current, [selection.view]: data.results }));
        setState({ key, items: data.results, count: data.count, error: "" });
        setCounts((current) => ({ ...current, [selection.view]: data.count }));
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setState({
            key,
            items: viewItemsCacheRef.current[selection.view] ?? [],
            count: 0,
            error: "We couldn't load this queue. Please refresh to try again.",
          });
        }
      });
    return () => controller.abort();
  }, [paths, selection, key, filters, filterKey, listReady]);

  const isLoading = listReady && state.key !== key;
  const cachedForView = viewItemsCache[selection.view] ?? [];
  const items =
    state.key === key ? state.items : isLoading ? cachedForView : state.items;

  return {
    activeView: selection.view,
    page: selection.page,
    counts,
    items,
    count: state.count,
    isLoading,
    isInitialLoading: !listReady || (isLoading && cachedForView.length === 0),
    error: state.key === key ? state.error : "",
    setActiveView: (view: K) => setSelection({ view, page: 1 }),
    setPage: (page: number) => setSelection((current) => ({ ...current, page })),
  };
}
