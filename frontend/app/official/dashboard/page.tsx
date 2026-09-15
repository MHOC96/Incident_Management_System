"use client";

import { useEffect, useState } from "react";
import {
  OfficialReviewQueueTabs,
  pickDefaultOfficialView,
  type OfficialQueueView,
} from "@/components/official/OfficialReviewQueueTabs";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { IncidentTable } from "@/components/dashboard/IncidentTable";
import { PageContainer } from "@/components/layout/PageContainer";
import { officialIncidentService } from "@/services/officialIncidents";
import type { OfficialIncident } from "@/types";

function toOfficialRow(incident: OfficialIncident) {
  return {
    id: incident.id,
    incident_number: incident.incident_number,
    title: incident.title,
    status: incident.status,
    priority: incident.priority,
    location: incident.location,
    href: `/official/incidents/${incident.id}`,
    date: incident.updated_at,
  };
}

function OfficialDashboardContent() {
  const [datasets, setDatasets] = useState<Record<OfficialQueueView, OfficialIncident[]>>({
    active: [],
    completed: [],
  });
  const [activeView, setActiveView] = useState<OfficialQueueView>("active");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      const results = await Promise.allSettled([
        officialIncidentService.listActiveAssignments(),
        officialIncidentService.listCompleted(),
      ]);
      const nextDatasets = {
        active: results[0].status === "fulfilled" ? results[0].value.results : [],
        completed: results[1].status === "fulfilled" ? results[1].value.results : [],
      };
      setDatasets(nextDatasets);
      setActiveView(
        pickDefaultOfficialView({
          active: nextDatasets.active.length,
          completed: nextDatasets.completed.length,
        }),
      );
      if (results.some((result) => result.status === "rejected")) {
        setError("Some incident lists could not be loaded. Refresh the page to try again.");
      }
      setIsLoading(false);
    })();
  }, []);

  const counts: Record<OfficialQueueView, number> = {
    active: datasets.active.length,
    completed: datasets.completed.length,
  };

  const copy: Record<OfficialQueueView, { title: string; empty: string; description: string }> = {
    active: {
      title: "Active assignments",
      empty: "No active assignments",
      description: "Incidents the Dean assigns to you appear here until you mark them resolved.",
    },
    completed: {
      title: "Completed",
      empty: "No completed assignments yet",
      description: "Resolved and closed incidents you worked on will appear here.",
    },
  };

  const rows = datasets[activeView].map(toOfficialRow);

  return (
    <PageContainer width="app">
      <section className="py-6 md:py-10">
        <h1 className="mb-5 text-[26px] font-semibold md:mb-6 md:text-[32px]">Assigned work</h1>

        {isLoading ? (
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
                <OfficialReviewQueueTabs
                  activeView={activeView}
                  counts={counts}
                  onChange={setActiveView}
                />
                <h2 className="pb-4 pt-5 text-[18px] font-semibold">{copy[activeView].title}</h2>
              </div>
              <IncidentTable
                showPriority
                rows={rows}
                emptyTitle={copy[activeView].empty}
                emptyDescription={copy[activeView].description}
                dateLabel="Updated"
              />
            </div>
          </>
        )}
      </section>
    </PageContainer>
  );
}

export default function OfficialDashboardPage() {
  return (
    <RequireAuth allowedRoles={["OFFICIAL"]}>
      <OfficialDashboardContent />
    </RequireAuth>
  );
}
