"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import type { QueueFilters } from "@/hooks/useIncidentQueue";
import { getCaseTypeLabel, getPriorityLabel } from "@/lib/format";
import { loadStaffCategories } from "@/lib/staffFilterOptions";
import { referenceService } from "@/services/incidents";
import type { CaseType, Category, IncidentPriority } from "@/types";

export type AuthorityDashboardFilterValues = QueueFilters;

const EMPTY: AuthorityDashboardFilterValues = {
  date_from: "",
  date_to: "",
  category: "",
  case_type: "",
  priority: "",
};

const ASSIGNED_PRIORITIES: IncidentPriority[] = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

type AuthorityDashboardFiltersProps = {
  value: AuthorityDashboardFilterValues;
  onChange: (next: AuthorityDashboardFilterValues) => void;
};

export function AuthorityDashboardFilters({ value, onChange }: AuthorityDashboardFiltersProps) {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    void loadStaffCategories(() => referenceService.listCategories())
      .then(setCategories)
      .catch(() => {
        /* Date and priority filters still work if categories fail to load. */
      });
  }, []);

  function updateField(field: keyof AuthorityDashboardFilterValues, fieldValue: string) {
    onChange({ ...value, [field]: fieldValue });
  }

  const hasFilters = Object.values(value).some((entry) => entry.trim());

  return (
    <div className="border-b border-border bg-background px-4 py-4 md:px-6">
      <p className="mb-3 text-sm font-semibold text-foreground">Filters</p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <label className="block text-sm font-medium text-foreground">
          <span className="mb-1.5 block text-text-secondary">From date</span>
          <Input
            type="date"
            value={value.date_from}
            onChange={(event) => updateField("date_from", event.target.value)}
            aria-label="Filter from submitted date"
          />
        </label>
        <label className="block text-sm font-medium text-foreground">
          <span className="mb-1.5 block text-text-secondary">To date</span>
          <Input
            type="date"
            value={value.date_to}
            onChange={(event) => updateField("date_to", event.target.value)}
            aria-label="Filter to submitted date"
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
        <label className="block text-sm font-medium text-foreground">
          <span className="mb-1.5 block text-text-secondary">Case type</span>
          <Select
            value={value.case_type}
            onChange={(event) => updateField("case_type", event.target.value)}
            aria-label="Filter by case type"
            searchable={false}
          >
            <option value="">All types</option>
            {(["COMPLAINT", "SUGGESTION"] as CaseType[]).map((caseType) => (
              <option key={caseType} value={caseType}>
                {getCaseTypeLabel(caseType)}
              </option>
            ))}
          </Select>
        </label>
        <label className="block text-sm font-medium text-foreground">
          <span className="mb-1.5 block text-text-secondary">Assigned priority</span>
          <Select
            value={value.priority}
            onChange={(event) => updateField("priority", event.target.value)}
            aria-label="Filter by assigned priority"
            searchable={false}
          >
            <option value="">All assigned priorities</option>
            {ASSIGNED_PRIORITIES.map((priority) => (
              <option key={priority} value={priority}>
                {getPriorityLabel(priority)}
              </option>
            ))}
            <option value="NOT_SET">Not set yet</option>
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

export { EMPTY as emptyAuthorityDashboardFilters };
