"use client";

import { useEffect, useState } from "react";
import { useIncidentQueue } from "@/hooks/useIncidentQueue";
import { Pagination } from "@/components/ui/Pagination";
import {
  ManagementReviewQueueTabs,
  type DeanQueueView,
} from "@/components/management/ManagementReviewQueueTabs";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { IncidentTable, type IncidentTableRow } from "@/components/dashboard/IncidentTable";
import { ManagementOverviewPanel } from "@/components/management/ManagementOverviewPanel";
import { PageContainer } from "@/components/layout/PageContainer";
import { formatAssignedOfficialLabel } from "@/lib/format";
import { deanIncidentService } from "@/services/managementIncidents";
import type { DeanIncident, ManagementOverview } from "@/types";

function toDeanRow(incident: DeanIncident, view: DeanQueueView): IncidentTableRow {
  return {
    id: incident.id,
    incident_number: incident.incident_number,
    title: incident.title,
    status: incident.status,
    priority: incident.priority,
    location: incident.location,
    href: `/management/incidents/${incident.id}`,
    date:
      view === "completed" && incident.closed_at ? incident.closed_at : incident.updated_at,
    assignedTo: incident.current_assignment
      ? formatAssignedOfficialLabel(incident.current_assignment)
      : undefined,
  };
}

const QUEUES: Record<DeanQueueView, string> = {"assignment":"/incidents/awaiting-action/","underway":"/incidents/currently-underway/","completed":"/incidents/dean-completed/"};

function DeanDashboardContent() {
  const { activeView, setActiveView, counts, items, isInitialLoading, isLoading, error, page, count, setPage } = useIncidentQueue<DeanQueueView, DeanIncident>(QUEUES, "assignment");
  const [overview, setOverview] = useState<ManagementOverview | null>(null);
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [overviewError, setOverviewError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const loadOverview = () => {
      void deanIncidentService
        .getManagementOverview()
        .then((data) => {
          if (!cancelled) {
            setOverview(data);
          }
        })
        .catch(() => {
          if (!cancelled) {
            setOverviewError("Could not load overview metrics. Refresh the page to try again.");
          }
        })
        .finally(() => {
          if (!cancelled) {
            setOverviewLoading(false);
          }
        });
    };
    if (typeof requestIdleCallback === "function") {
      const idleId = requestIdleCallback(loadOverview, { timeout: 2500 });
      return () => {
        cancelled = true;
        cancelIdleCallback(idleId);
      };
    }
    loadOverview();
    return () => {
      cancelled = true;
    };
  }, []);

  const copy: Record<DeanQueueView, { title: string; empty: string; description: string }> = {
    underway: {
      title: "Currently underway",
      empty: "No cases are currently underway",
      description:
        "Assigned, in-progress, and resolved reports appear here until the administrator closes them.",
    },
    assignment: {
      title: "Needs assignment",
      empty: "No cases awaiting assignment",
      description: "Accepted cases appear here after administrative review.",
    },
    completed: {
      title: "Completed",
      empty: "No closed cases yet",
      description: "Closed cases are listed here for reference.",
    },
  };

  const rows = items.map((incident) => toDeanRow(incident, activeView));

  return (
    <PageContainer width="app">
      <section className="py-6 md:py-10">
        <h1 className="mb-5 text-[26px] font-semibold md:mb-6 md:text-[32px]">Overview</h1>

        <ManagementOverviewPanel
          data={overview}
          isLoading={overviewLoading}
          error={overviewError}
        />

        {isInitialLoading ? (
          <p className="py-12 text-sm text-text-secondary">Loading management workspace...</p>
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
                <ManagementReviewQueueTabs
                  activeView={activeView}
                  counts={counts}
                  onChange={setActiveView}
                />
                <h2 className="pb-4 pt-5 text-[18px] font-semibold">{copy[activeView].title}</h2>
              </div>
              <IncidentTable
                showPriority
                urgencySource="official"
                priorityLabel="Priority"
                showAssigned
                isLoading={isLoading}
                rows={rows}
                emptyTitle={copy[activeView].empty}
                emptyDescription={copy[activeView].description}
                dateLabel={activeView === "completed" ? "Closed" : "Updated"}
              />
              <Pagination page={page} count={count} onChange={setPage} />
            </div>
          </>
        )}
      </section>
    </PageContainer>
  );
}

export default function DeanDashboardPage() {
  return (
    <RequireAuth allowedRoles={["MANAGEMENT"]}>
      <DeanDashboardContent />
    </RequireAuth>
  );
}
