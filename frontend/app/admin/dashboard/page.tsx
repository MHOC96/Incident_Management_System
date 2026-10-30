"use client";

import { useEffect, useState } from "react";
import {
  AdminDashboardFilters,
  emptyAdminDashboardFilters,
  type AdminDashboardFilterValues,
} from "@/components/admin/AdminDashboardFilters";
import {
  AdminReviewQueueTabs,
  pickDefaultAdminView,
  type AdminReviewView,
} from "@/components/admin/AdminReviewQueueTabs";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { IncidentTable } from "@/components/dashboard/IncidentTable";
import { PageContainer } from "@/components/layout/PageContainer";
import { useIncidentQueue } from "@/hooks/useIncidentQueue";
import { formatAssignedOfficialLabel } from "@/lib/format";
import { Pagination } from "@/components/ui/Pagination";
import type { AdminIncidentReview, DeanIncident } from "@/types";

const QUEUES: Record<AdminReviewView, string> = {
  review: "/incidents/pending-review/",
  changes: "/incidents/pending-changes/",
  assignment: "/incidents/awaiting-action/",
  underway: "/incidents/currently-underway/",
  completed: "/incidents/dean-completed/",
  rejected: "/incidents/rejected-reports/",
};

function AdminDashboardContent() {
  const [draftFilters, setDraftFilters] =
    useState<AdminDashboardFilterValues>(emptyAdminDashboardFilters);
  const [filters, setFilters] = useState<AdminDashboardFilterValues>(emptyAdminDashboardFilters);

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
  } = useIncidentQueue<AdminReviewView, AdminIncidentReview>(
    QUEUES,
    "review",
    true,
    filters,
    { resolveInitialView: pickDefaultAdminView },
  );

  function handleFiltersChange(next: AdminDashboardFilterValues) {
    setDraftFilters(next);
    setPage(1);
  }

  const showAssignedColumn =
    activeView === "assignment" || activeView === "underway" || activeView === "completed";

  const rows = items.map((incident) => {
    const assignment = showAssignedColumn
      ? (incident as DeanIncident).current_assignment
      : null;
    return {
      id: incident.id,
      incident_number: incident.incident_number,
      title: incident.title,
      status: incident.status,
      priority: incident.priority,
      reporterPriority: incident.reporter_priority,
      location: incident.location,
      href: `/admin/incidents/${incident.id}`,
      date:
        activeView === "completed" && incident.closed_at
          ? incident.closed_at
          : activeView === "changes" && incident.pending_revision
            ? incident.pending_revision.submitted_at
            : incident.updated_at,
      reporter: incident.reporter.name,
      category: incident.category.name,
      assignedTo: assignment ? formatAssignedOfficialLabel(assignment) : undefined,
    };
  });

  const copy: Record<
    AdminReviewView,
    { title: string; empty: string; description: string }
  > = {
    review: {
      title: "Reports awaiting review",
      empty: "No reports awaiting review",
      description: "New and resubmitted student reports will appear here.",
    },
    changes: {
      title: "Case changes awaiting review",
      empty: "No pending changes",
      description: "Edits to previously accepted cases will appear here.",
    },
    assignment: {
      title: "Awaiting assignment",
      empty: "No cases awaiting assignment",
      description:
        "After you verify a report (Not started), it appears here. Open a case and use Assign official.",
    },
    underway: {
      title: "In progress",
      empty: "No assigned cases in progress",
      description:
        "Assigned, in-progress, and resolved cases appear here. Close resolved cases from the case detail page.",
    },
    completed: {
      title: "Completed",
      empty: "No closed cases yet",
      description: "Cases you have closed are listed here for reference.",
    },
    rejected: {
      title: "Rejected reports",
      empty: "No rejected reports",
      description: "Rejected cases and their review reasons will appear here.",
    },
  };

  return (
    <PageContainer width="app">
      <section className="py-6 md:py-10">
        {isInitialLoading ? (
          <div className="animate-pulse space-y-3 border border-border bg-surface p-6">
            <div className="h-4 w-1/3 rounded-sm bg-border" />
            <div className="h-8 w-2/3 rounded-sm bg-border" />
          </div>
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
                <AdminReviewQueueTabs
                  activeView={activeView}
                  counts={counts}
                  onChange={setActiveView}
                />
                <h2 className="pb-4 pt-5 text-[18px] font-semibold">
                  {copy[activeView].title}
                </h2>
              </div>
              <AdminDashboardFilters
                activeView={activeView}
                value={draftFilters}
                onChange={handleFiltersChange}
              />
              <IncidentTable
                showReporter
                showCategory
                showPriority
                urgencySource="reporter"
                priorityLabel="Reporter urgency"
                showAssigned={showAssignedColumn}
                isLoading={isLoading}
                rows={rows}
                emptyTitle={copy[activeView].empty}
                emptyDescription={copy[activeView].description}
                dateLabel={
                  activeView === "completed"
                    ? "Closed"
                    : activeView === "changes"
                      ? "Changes submitted"
                      : "Updated"
                }
              />
              <Pagination page={page} count={count} onChange={setPage} />
            </div>
          </>
        )}
      </section>
    </PageContainer>
  );
}

export default function AdminDashboardPage() {
  return (
    <RequireAuth allowedRoles={["ADMIN"]}>
      <AdminDashboardContent />
    </RequireAuth>
  );
}
