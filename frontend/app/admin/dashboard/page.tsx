"use client";

import { useEffect, useState } from "react";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { IncidentTable } from "@/components/dashboard/IncidentTable";
import { StatsStrip } from "@/components/dashboard/StatsStrip";
import { PageContainer } from "@/components/layout/PageContainer";
import { adminIncidentService } from "@/services/adminIncidents";
import type { AdminIncidentReview, AdminReviewStats } from "@/types";

type View = "review" | "changes" | "forwarded" | "rejected";

const VIEWS: { value: View; label: string }[] = [
  { value: "review", label: "New reports" },
  { value: "changes", label: "Pending changes" },
  { value: "forwarded", label: "Forwarded to Dean" },
  { value: "rejected", label: "Rejected" },
];

function AdminDashboardContent() {
  const [stats, setStats] = useState<AdminReviewStats | null>(null);
  const [datasets, setDatasets] = useState<Record<View, AdminIncidentReview[]>>({
    review: [], changes: [], forwarded: [], rejected: [],
  });
  const [activeView, setActiveView] = useState<View>("review");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      const results = await Promise.allSettled([
        adminIncidentService.getReviewStats(),
        adminIncidentService.listPendingReview(),
        adminIncidentService.listPendingChanges(),
        adminIncidentService.listForwarded(),
        adminIncidentService.listRejected(),
      ]);
      if (results[0].status === "fulfilled") setStats(results[0].value);
      setDatasets({
        review: results[1].status === "fulfilled" ? results[1].value.results : [],
        changes: results[2].status === "fulfilled" ? results[2].value.results : [],
        forwarded: results[3].status === "fulfilled" ? results[3].value.results : [],
        rejected: results[4].status === "fulfilled" ? results[4].value.results : [],
      });
      if (results.some((result) => result.status === "rejected")) {
        setError("Some incident lists could not be loaded. Refresh the page to try again.");
      }
      setIsLoading(false);
    })();
  }, []);

  const rows = datasets[activeView].map((incident) => ({
    id: incident.id,
    incident_number: incident.incident_number,
    title: incident.title,
    status: incident.status,
    priority: incident.priority,
    location: incident.location,
    href: `/admin/incidents/${incident.id}`,
    date: activeView === "changes" && incident.pending_revision
      ? incident.pending_revision.submitted_at
      : incident.updated_at,
    reporter: incident.reporter.name,
    category: incident.category.name,
  }));

  const copy: Record<View, { title: string; empty: string; description: string }> = {
    review: { title: "Reports awaiting review", empty: "No reports awaiting review", description: "New and resubmitted student reports will appear here." },
    changes: { title: "Incident changes awaiting review", empty: "No pending changes", description: "Edits to previously approved incidents will appear here." },
    forwarded: { title: "Forwarded incident progress", empty: "No forwarded incidents", description: "Incidents sent to the Dean and their current status will appear here." },
    rejected: { title: "Rejected reports", empty: "No rejected reports", description: "Rejected incidents and their review reasons will appear here." },
  };

  return (
    <PageContainer width="app">
      <section className="py-6 md:py-10">
        <header className="mb-6 md:mb-8">
          <h1 className="text-[26px] font-semibold md:text-[32px]">Incident review</h1>
          <p className="mt-2 text-text-secondary">Review new reports and changes, then monitor incidents forwarded to the Dean.</p>
        </header>

        {isLoading ? <p className="py-12 text-sm text-text-secondary">Loading review workspace...</p> : (
          <>
            {error ? <p className="mb-4 rounded-md border border-warning/20 bg-warning/5 px-3 py-2 text-sm text-warning" role="status">{error}</p> : null}
            <StatsStrip items={[
              { value: stats?.pending_verification ?? 0, label: "New reports" },
              { value: stats?.pending_changes ?? 0, label: "Pending changes" },
              { value: stats?.verified ?? 0, label: "Verified" },
              { value: stats?.forwarded_to_dean ?? 0, label: "Awaiting Dean" },
              { value: stats?.rejected ?? 0, label: "Rejected" },
            ]} />

            <div className="border border-border bg-surface">
              <div className="border-b border-border px-4 py-4 md:px-6">
                <div className="flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Admin incident views">
                  {VIEWS.map((view) => (
                    <button key={view.value} type="button" role="tab" aria-selected={activeView === view.value} onClick={() => setActiveView(view.value)} className={`min-h-11 shrink-0 rounded-md border px-4 text-sm font-medium ${activeView === view.value ? "border-primary bg-primary/5 text-foreground" : "border-border text-text-secondary hover:bg-surface-hover"}`}>
                      {view.label} ({datasets[view.value].length})
                    </button>
                  ))}
                </div>
                <h2 className="mt-5 text-[18px] font-semibold">{copy[activeView].title}</h2>
              </div>
              <IncidentTable showReporter showCategory showPriority rows={rows} emptyTitle={copy[activeView].empty} emptyDescription={copy[activeView].description} dateLabel={activeView === "changes" ? "Changes submitted" : "Updated"} />
            </div>
          </>
        )}
      </section>
    </PageContainer>
  );
}

export default function AdminDashboardPage() {
  return <RequireAuth allowedRoles={["ADMIN"]}><AdminDashboardContent /></RequireAuth>;
}
