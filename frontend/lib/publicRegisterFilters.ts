import type { Category, Location } from "@/types";

export type PublicRegisterFilterOptions = {
  categories: Category[];
  locations: Location[];
};

let cachedFilterOptions: PublicRegisterFilterOptions | null = null;

export function getCachedPublicRegisterFilters(): PublicRegisterFilterOptions | null {
  return cachedFilterOptions;
}

export function setCachedPublicRegisterFilters(options: PublicRegisterFilterOptions): void {
  cachedFilterOptions = options;
}

export function clearCachedPublicRegisterFilters(): void {
  cachedFilterOptions = null;
}
