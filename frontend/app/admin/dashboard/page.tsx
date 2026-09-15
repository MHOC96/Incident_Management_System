"use client";

import { useEffect, useState } from "react";
import {
  AdminReviewQueueTabs,
  pickDefaultAdminView,
  type AdminReviewView,
} from "@/components/admin/AdminReviewQueueTabs";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { IncidentTable } from "@/components/dashboard/IncidentTable";
import { PageContainer } from "@/components/layout/PageContainer";
import { adminIncidentService } from "@/services/adminIncidents";
import type { AdminIncidentReview } from "@/types";

function AdminDashboardContent() {
  const [datasets, setDatasets] = useState<Record<AdminReviewView, AdminIncidentReview[]>>({
    review: [],
    changes: [],
    forwarded: [],
    rejected: [],
  });
  const [activeView, setActiveView] = useState<AdminReviewView>("review");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      const results = await Promise.allSettled([
        adminIncidentService.listPendingReview(),
        adminIncidentService.listPendingChanges(),
        adminIncidentService.listForwarded(),
        adminIncidentService.listRejected(),
      ]);
      const nextDatasets = {
        review: results[0].status === "fulfilled" ? results[0].value.results : [],
        changes: results[1].status === "fulfilled" ? results[1].value.results : [],
        forwarded: results[2].status === "fulfilled" ? results[2].value.results : [],
        rejected: results[3].status === "fulfilled" ? results[3].value.results : [],
      };
      setDatasets(nextDatasets);
      setActiveView(
        pickDefaultAdminView({
          review: nextDatasets.review.length,
          changes: nextDatasets.changes.length,
          forwarded: nextDatasets.forwarded.length,
          rejected: nextDatasets.rejected.length,
        }),
      );
      if (results.some((result) => result.status === "rejected")) {
        setError("Some incident lists could not be loaded. Refresh the page to try again.");
      }
      setIsLoading(false);
    })();
  }, []);

  const counts: Record<AdminReviewView, number> = {
    review: datasets.review.length,
    changes: datasets.changes.length,
    forwarded: datasets.forwarded.length,
    rejected: datasets.rejected.length,
  };

  const rows = datasets[activeView].map((incident) => ({
    id: incident.id,
    incident_number: incident.incident_number,
    title: incident.title,
    status: incident.status,
    priority: incident.priority,
    location: incident.location,
    href: `/admin/incidents/${incident.id}`,
    date:
      activeView === "changes" && incident.pending_revision
        ? incident.pending_revision.submitted_at
        : incident.updated_at,
    reporter: incident.reporter.name,
    category: incident.category.name,
  }));

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
      title: "Incident changes awaiting review",
      empty: "No pending changes",
      description: "Edits to previously approved incidents will appear here.",
    },
    forwarded: {
      title: "Forwarded incident progress",
      empty: "No forwarded incidents",
      description: "Incidents sent to the Dean and their current status will appear here.",
    },
    rejected: {
      title: "Rejected reports",
      empty: "No rejected reports",
      description: "Rejected incidents and their review reasons will appear here.",
    },
  };

  return (
    <PageContainer width="app">
      <section className="py-6 md:py-10">
        {isLoading ? (
          <p className="py-12 text-sm text-text-secondary">Loading review workspace...</p>
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
              <IncidentTable
                showReporter
                showCategory
                showPriority
                rows={rows}
                emptyTitle={copy[activeView].empty}
                emptyDescription={copy[activeView].description}
                dateLabel={activeView === "changes" ? "Changes submitted" : "Updated"}
              />
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
