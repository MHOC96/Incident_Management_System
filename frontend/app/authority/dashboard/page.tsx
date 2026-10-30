"use client";

import { useEffect, useState } from "react";
import {
  AuthorityDashboardFilters,
  emptyAuthorityDashboardFilters,
  type AuthorityDashboardFilterValues,
} from "@/components/authority/AuthorityDashboardFilters";
import {
  AuthorityReviewQueueTabs,
  type OfficialQueueView,
} from "@/components/authority/AuthorityReviewQueueTabs";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { IncidentTable } from "@/components/dashboard/IncidentTable";
import { PageContainer } from "@/components/layout/PageContainer";
import { useIncidentQueue } from "@/hooks/useIncidentQueue";
import { Pagination } from "@/components/ui/Pagination";
import type { OfficialIncident } from "@/types";

function toOfficialRow(incident: OfficialIncident) {
  return {
    id: incident.id,
    incident_number: incident.incident_number,
    title: incident.title,
    status: incident.status,
    priority: incident.priority,
    location: incident.location,
    href: `/authority/incidents/${incident.id}`,
    date: incident.updated_at,
    category: incident.category.name,
  };
}

const QUEUES: Record<OfficialQueueView, string> = {
  active: "/incidents/assigned/",
  completed: "/incidents/completed/",
};

function OfficialDashboardContent() {
  const [draftFilters, setDraftFilters] = useState<AuthorityDashboardFilterValues>(
    emptyAuthorityDashboardFilters,
  );
  const [filters, setFilters] = useState<AuthorityDashboardFilterValues>(
    emptyAuthorityDashboardFilters,
  );

  useEffect(() => {
    const timeout = window.setTimeout(() => setFilters(draftFilters), 300);
    return () => window.clearTimeout(timeout);
  }, [draftFilters]);

  const {
    activeView,
    setActiveView,
    counts,
    items,
    isInitialLoading,
    isLoading,
    error,
    page,
    count,
    setPage,
  } = useIncidentQueue<OfficialQueueView, OfficialIncident>(
    QUEUES,
    "active",
    true,
    filters,
  );

  function handleFiltersChange(next: AuthorityDashboardFilterValues) {
    setDraftFilters(next);
    setPage(1);
  }

  const copy: Record<OfficialQueueView, { title: string; empty: string; description: string }> = {
    active: {
      title: "Active assignments",
      empty: "No active assignments",
      description: "Cases the administrator assigns to you appear here until you mark them resolved.",
    },
    completed: {
      title: "Completed",
      empty: "No completed assignments yet",
      description: "Resolved and closed cases you worked on will appear here.",
    },
  };

  const rows = items.map(toOfficialRow);

  return (
    <PageContainer width="app">
      <section className="py-6 md:py-10">
        <h1 className="mb-5 text-[26px] font-semibold md:mb-6 md:text-[32px]">Assigned work</h1>

        {isInitialLoading ? (
          <p className="py-12 text-sm text-text-secondary">Loading your workspace...</p>
        ) : (
          <>
            {error ? (
              <p
                className="mb-4 rounded-md border border-warning/20 bg-warning/5 px-3 py-2 text-sm text-warning"
                role="status"
              >
                {error}
              </p>
            ) : null}

            <div className="border border-border bg-surface">
              <div className="border-b border-border px-4 pt-3 md:px-6 md:pt-4">
                <AuthorityReviewQueueTabs
                  activeView={activeView}
                  counts={counts}
                  onChange={setActiveView}
                />
                <h2 className="pb-4 pt-5 text-[18px] font-semibold">{copy[activeView].title}</h2>
              </div>
              <AuthorityDashboardFilters value={draftFilters} onChange={handleFiltersChange} />
              <IncidentTable
                showPriority
                urgencySource="official"
                priorityLabel="Assigned priority"
                showCategory
                isLoading={isLoading}
                rows={rows}
                emptyTitle={copy[activeView].empty}
                emptyDescription={copy[activeView].description}
                dateLabel="Updated"
              />
              <Pagination page={page} count={count} onChange={setPage} />
            </div>
          </>
        )}
      </section>
    </PageContainer>
  );
}

export default function OfficialDashboardPage() {
  return (
    <RequireAuth allowedRoles={["AUTHORITY"]}>
      <OfficialDashboardContent />
    </RequireAuth>
  );
}
