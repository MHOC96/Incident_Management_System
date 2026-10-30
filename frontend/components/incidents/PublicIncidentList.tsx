"use client";

import { useEffect, useState } from "react";
import { Pagination } from "@/components/ui/Pagination";
import { PublicIncidentRow } from "@/components/incidents/PublicIncidentRow";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import {
  clearCachedPublicRegisterFilters,
  getCachedPublicRegisterFilters,
  setCachedPublicRegisterFilters,
} from "@/lib/publicRegisterFilters";
import { isAbortError } from "@/lib/abort";
import { placeholders } from "@/lib/placeholders";
import { incidentService, type PublicIncidentQuery } from "@/services/incidents";
import type { Category, IncidentVoteResult, Location, PublicIncident } from "@/types";

type PublicIncidentListProps = {
  limit?: number;
};

function buildListQuery(
  deferredQuery: string,
  categoryId: string,
  locationId: string,
  stage: PublicIncidentQuery["stage"],
  ordering: PublicIncidentQuery["ordering"],
  page: number,
): PublicIncidentQuery {
  return {
    q: deferredQuery,
    category: categoryId,
    location: locationId,
    stage,
    ordering,
    page: String(page),
  };
}

export function PublicIncidentList({ limit }: PublicIncidentListProps) {
  const cachedFilters = getCachedPublicRegisterFilters();
  const [page, setPage] = useState(1);
  const [count, setCount] = useState(0);
  const [retryCount, setRetryCount] = useState(0);
  const [incidents, setIncidents] = useState<PublicIncident[]>([]);
  const [categories, setCategories] = useState<Category[]>(cachedFilters?.categories ?? []);
  const [locations, setLocations] = useState<Location[]>(cachedFilters?.locations ?? []);
  const [query, setQuery] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [locationId, setLocationId] = useState("");
  const [stage, setStage] = useState<"" | "forwarded" | "in_progress" | "completed">("");
  const [ordering, setOrdering] = useState<"recent" | "highest_votes">("recent");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [deferredQuery, setDeferredQuery] = useState(query);

  useEffect(() => {
    const timeout = window.setTimeout(() => setDeferredQuery(query), 300);
    return () => window.clearTimeout(timeout);
  }, [query]);

  useEffect(() => {
    const controller = new AbortController();

    async function loadPublicRegister() {
      try {
        setIsLoading(true);
        if (limit) {
          const response = await incidentService.listPublic(
            { ordering: "recent", page_size: String(limit) },
            controller.signal,
          );
          if (controller.signal.aborted) return;
          setIncidents(response.results);
          return;
        }

        const listQuery = buildListQuery(
          deferredQuery,
          categoryId,
          locationId,
          stage,
          ordering,
          page,
        );

        if (!getCachedPublicRegisterFilters()) {
          const response = await incidentService.listPublicRegister(listQuery, controller.signal);
          if (controller.signal.aborted) return;
          setCachedPublicRegisterFilters({
            categories: response.categories,
            locations: response.locations,
          });
          setCategories(response.categories);
          setLocations(response.locations);
          setIncidents(response.results);
          setCount(response.count);
          return;
        }

        const response = await incidentService.listPublic(listQuery, controller.signal);
        if (controller.signal.aborted) return;
        setIncidents(response.results);
        setCount(response.count);
      } catch (error) {
        if (controller.signal.aborted || isAbortError(error)) return;
        setError("The public register could not be loaded. Please refresh the page or try again later.");
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }

    void loadPublicRegister().catch((error) => {
      if (controller.signal.aborted || isAbortError(error)) return;
      setError("The public register could not be loaded. Please refresh the page or try again later.");
    });

    return () => controller.abort();
  }, [
    limit,
    retryCount,
    deferredQuery,
    categoryId,
    locationId,
    stage,
    ordering,
    page,
  ]);

  const visible = typeof limit === "number" ? incidents.slice(0, limit) : incidents;

  function handleVoteChange(incidentId: number, result: IncidentVoteResult) {
    setIncidents((current) => {
      const updated = current.map((incident) =>
        incident.id === incidentId ? { ...incident, ...result } : incident,
      );
      return ordering === "highest_votes"
        ? updated.sort((left, right) => right.vote_count - left.vote_count)
        : updated;
    });
  }

  function handleRetry() {
    clearCachedPublicRegisterFilters();
    setError("");
    setCategories([]);
    setLocations([]);
    setIsLoading(true);
    setRetryCount((count) => count + 1);
  }

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-3 border-y border-border py-6">
        <div className="h-4 w-1/3 rounded-sm bg-border" />
        <div className="h-6 w-2/3 rounded-sm bg-border" />
        <div className="h-4 w-1/2 rounded-sm bg-border" />
      </div>
    );
  }

  if (error) {
    return (
      <div role="alert" className="border border-danger/20 bg-danger/5 px-6 py-8 text-sm text-danger">
        <p>{error}</p>
        <Button className="mt-4 w-full sm:w-auto" variant="secondary" onClick={handleRetry}>
          Try again
        </Button>
      </div>
    );
  }

  return (
    <div>
      {limit ? null : (
        <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-5">
          <label className="col-span-2 block text-sm font-semibold text-foreground lg:col-span-1">
            <span className="mb-2 block">Search cases</span>
            <Input
              type="search"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setPage(1);
              }}
              placeholder={placeholders.searchIncidents}
              aria-label="Search by case number or title"
            />
          </label>
          <label className="block text-sm font-semibold text-foreground">
            <span className="mb-2 block">Category</span>
            <Select
              value={categoryId}
              onChange={(event) => {
                setCategoryId(event.target.value);
                setPage(1);
              }}
              aria-label="Filter by category"
              searchable
              searchPlaceholder="Search categories..."
            >
              <option value="">All categories</option>
              {categories.map((category) => (
                <option key={category.id} value={String(category.id)}>
                  {category.name}
                </option>
              ))}
            </Select>
          </label>
          <label className="block text-sm font-semibold text-foreground">
            <span className="mb-2 block">Location</span>
            <Select
              value={locationId}
              onChange={(event) => {
                setLocationId(event.target.value);
                setPage(1);
              }}
              aria-label="Filter by location"
              searchable
              searchPlaceholder="Search locations..."
            >
              <option value="">All locations</option>
              {locations.map((location) => (
                <option key={location.id} value={String(location.id)}>
                  {location.name}
                </option>
              ))}
            </Select>
          </label>
          <label className="block text-sm font-semibold text-foreground">
            <span className="mb-2 block">Progress</span>
            <Select
              value={stage}
              onChange={(event) => {
                setStage(event.target.value as typeof stage);
                setPage(1);
              }}
              aria-label="Filter by progress"
              searchable={false}
            >
              <option value="">All progress</option>
              <option value="forwarded">Awaiting assignment</option>
              <option value="in_progress">In progress</option>
              <option value="completed">Completed</option>
            </Select>
          </label>
          <label className="block text-sm font-semibold text-foreground">
            <span className="mb-2 block">Sort by</span>
            <Select
              value={ordering}
              onChange={(event) => {
                setOrdering(event.target.value as typeof ordering);
                setPage(1);
              }}
              aria-label="Sort cases"
              searchable={false}
            >
              <option value="recent">Most recent</option>
              <option value="highest_votes">Highest votes</option>
            </Select>
          </label>
        </div>
      )}

      {!limit && (query || categoryId || locationId || stage || ordering !== "recent") ? (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <p role="status" className="text-sm text-text-secondary">
            {count} matching {count === 1 ? "case" : "cases"}
          </p>
          <Button
            variant="ghost"
            onClick={() => {
              setPage(1);
              setQuery("");
              setCategoryId("");
              setLocationId("");
              setStage("");
              setOrdering("recent");
            }}
          >
            Clear filters
          </Button>
        </div>
      ) : null}
      {visible.length === 0 ? (
        <p className="border-t border-border py-8 text-text-secondary">
          {query || categoryId || locationId || stage
            ? "There are no public complaints or suggestions matching your search."
            : "No public complaints or suggestions are listed at this time. Cases marked public after review will appear here."}
        </p>
      ) : (
        <div className="divide-y divide-border border-y border-border">
          {visible.map((incident) => (
            <PublicIncidentRow
              key={incident.id}
              incident={incident}
              onVoteChange={handleVoteChange}
            />
          ))}
        </div>
      )}
      {!limit && <Pagination page={page} count={count} onChange={setPage} />}
    </div>
  );
}
