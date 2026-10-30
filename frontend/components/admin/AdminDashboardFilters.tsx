"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import type { AdminReviewView } from "@/components/admin/AdminReviewQueueTabs";
import type { QueueFilters } from "@/hooks/useIncidentQueue";
import { getPriorityLabel, getStatusLabel } from "@/lib/format";
import {
  getCachedStaffFilterOptions,
  loadStaffFilterOptions,
} from "@/lib/staffFilterOptions";
import { referenceService } from "@/services/incidents";
import { officialService } from "@/services/officials";
import type { Category, IncidentPriority, IncidentStatus, OfficialAccount } from "@/types";

export type AdminDashboardFilterValues = QueueFilters;

const EMPTY: AdminDashboardFilterValues = {
  date_from: "",
  date_to: "",
  category: "",
  authority: "",
  priority: "",
  status: "",
};

const OFFICIAL_PRIORITIES: IncidentPriority[] = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

type AdminDashboardFiltersProps = {
  activeView: AdminReviewView;
  value: AdminDashboardFilterValues;
  onChange: (next: AdminDashboardFilterValues) => void;
};

export function AdminDashboardFilters({
  activeView,
  value,
  onChange,
}: AdminDashboardFiltersProps) {
  const cached = getCachedStaffFilterOptions();
  const [categories, setCategories] = useState<Category[]>(cached?.categories ?? []);
  const [authorities, setAuthorities] = useState<OfficialAccount[]>(cached?.authorities ?? []);

  useEffect(() => {
    if (activeView !== "assignment" || !value.authority.trim()) return;
    onChange({ ...value, authority: "" });
    // Clear authority filter when viewing unassigned queue (would hide every row).
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only when tab changes
  }, [activeView]);

  useEffect(() => {
    void loadStaffFilterOptions(() =>
      Promise.all([referenceService.listCategories(), officialService.listActive()]).then(
        ([categoryData, authorityData]) => ({
          categories: categoryData,
          authorities: authorityData,
        }),
      ),
    )
      .then(({ categories: categoryData, authorities: authorityData }) => {
        setCategories(categoryData);
        setAuthorities(authorityData);
      })
      .catch(() => {
        /* Filters still work for date/status; dropdowns may stay empty. */
      });
  }, []);

  function updateField(field: keyof AdminDashboardFilterValues, fieldValue: string) {
    onChange({ ...value, [field]: fieldValue });
  }

  const hasFilters = Object.values(value).some((entry) => entry.trim());

  return (
    <div className="border-b border-border bg-background px-4 py-4 md:px-6">
      <p className="mb-3 text-sm font-semibold text-foreground">Filters</p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <label className="block text-sm font-medium text-foreground">
          <span className="mb-1.5 block text-text-secondary">From date</span>
          <Input
            type="date"
            value={value.date_from}
            onChange={(event) => updateField("date_from", event.target.value)}
            aria-label="Filter from date"
          />
        </label>
        <label className="block text-sm font-medium text-foreground">
          <span className="mb-1.5 block text-text-secondary">To date</span>
          <Input
            type="date"
            value={value.date_to}
            onChange={(event) => updateField("date_to", event.target.value)}
            aria-label="Filter to date"
          />
        </label>
        <label className="block text-sm font-medium text-foreground">
          <span className="mb-1.5 block text-text-secondary">Category</span>
          <Select
            value={value.category}
            onChange={(event) => updateField("category", event.target.value)}
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
        {activeView === "assignment" ? null : (
          <label className="block text-sm font-medium text-foreground">
            <span className="mb-1.5 block text-text-secondary">Authority</span>
            <Select
              value={value.authority}
              onChange={(event) => updateField("authority", event.target.value)}
              aria-label="Filter by assigned authority"
              searchable
              searchPlaceholder="Search authorities..."
            >
              <option value="">All authorities</option>
              {authorities.map((authority) => (
                <option key={authority.id} value={String(authority.id)}>
                  {authority.name}
                </option>
              ))}
            </Select>
          </label>
        )}
        <label className="block text-sm font-medium text-foreground">
          <span className="mb-1.5 block text-text-secondary">Priority</span>
          <Select
            value={value.priority}
            onChange={(event) => updateField("priority", event.target.value)}
            aria-label="Filter by priority"
            searchable={false}
          >
            <option value="">All priorities</option>
            {OFFICIAL_PRIORITIES.map((priority) => (
              <option key={priority} value={priority}>
                Official: {getPriorityLabel(priority)}
              </option>
            ))}
            <option value="REPORTER_URGENT">Reporter: Urgent</option>
            <option value="REPORTER_NORMAL">Reporter: Normal</option>
            <option value="NOT_SET">Official not set</option>
          </Select>
        </label>
        <label className="block text-sm font-medium text-foreground">
          <span className="mb-1.5 block text-text-secondary">Status</span>
          <Select
            value={value.status}
            onChange={(event) => updateField("status", event.target.value)}
            aria-label="Filter by status"
            searchable={false}
          >
            <option value="">All statuses</option>
            {(
              [
                "SUBMITTED",
                "UNDER_REVIEW",
                "NOT_STARTED",
                "ASSIGNED",
                "IN_PROGRESS",
                "WAITING_FOR_INFORMATION",
                "RESOLVED",
                "CLOSED",
                "REJECTED",
                "REOPENED",
              ] as IncidentStatus[]
            ).map((status) => (
              <option key={status} value={status}>
                {getStatusLabel(status)}
              </option>
            ))}
          </Select>
        </label>
      </div>
      {hasFilters ? (
        <div className="mt-3">
          <Button type="button" variant="ghost" onClick={() => onChange({ ...EMPTY })}>
            Clear filters
          </Button>
        </div>
      ) : null}
    </div>
  );
}

export { EMPTY as emptyAdminDashboardFilters };
