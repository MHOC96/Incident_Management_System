import type { Category, OfficialAccount } from "@/types";

type StaffFilterOptions = {
  categories: Category[];
  authorities: OfficialAccount[];
};

let cached: StaffFilterOptions | null = null;
let inflight: Promise<StaffFilterOptions> | null = null;

export function getCachedStaffFilterOptions(): StaffFilterOptions | null {
  return cached;
}

export function loadStaffFilterOptions(
  fetcher: () => Promise<StaffFilterOptions>,
): Promise<StaffFilterOptions> {
  if (cached) {
    return Promise.resolve(cached);
  }
  if (inflight) {
    return inflight;
  }
  inflight = fetcher()
    .then((data) => {
      cached = data;
      return data;
    })
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

export function clearCachedStaffFilterOptions(): void {
  cached = null;
  inflight = null;
}

let categoriesInflight: Promise<Category[]> | null = null;

/** Shared category dropdown data for staff dashboards. */
export function loadStaffCategories(
  fetcher: () => Promise<Category[]>,
): Promise<Category[]> {
  if (cached?.categories.length) {
    return Promise.resolve(cached.categories);
  }
  if (categoriesInflight) {
    return categoriesInflight;
  }
  categoriesInflight = fetcher()
    .then((categories) => {
      cached = { categories, authorities: cached?.authorities ?? [] };
      return categories;
    })
    .finally(() => {
      categoriesInflight = null;
    });
  return categoriesInflight;
}
