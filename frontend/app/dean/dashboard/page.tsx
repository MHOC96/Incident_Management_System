"use client";

import { useEffect, useState } from "react";
import {
  DeanReviewQueueTabs,
  pickDefaultDeanView,
  type DeanQueueView,
} from "@/components/dean/DeanReviewQueueTabs";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { IncidentTable, type IncidentTableRow } from "@/components/dashboard/IncidentTable";
import { PageContainer } from "@/components/layout/PageContainer";
import { formatAssignedOfficialLabel } from "@/lib/format";
import { deanIncidentService } from "@/services/deanIncidents";
import type { DeanIncident } from "@/types";

function toDeanRow(incident: DeanIncident, view: DeanQueueView): IncidentTableRow {
  return {
    id: incident.id,
    incident_number: incident.incident_number,
    title: incident.title,
    status: incident.status,
    priority: incident.priority,
    location: incident.location,
    href: `/dean/incidents/${incident.id}`,
    date:
      view === "completed" && incident.closed_at ? incident.closed_at : incident.updated_at,
    assignedTo: incident.current_assignment
      ? formatAssignedOfficialLabel(incident.current_assignment)
      : undefined,
  };
}

function DeanDashboardContent() {
  const [datasets, setDatasets] = useState<Record<DeanQueueView, DeanIncident[]>>({
    underway: [],
    assignment: [],
    completed: [],
  });
  const [activeView, setActiveView] = useState<DeanQueueView>("assignment");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      const results = await Promise.allSettled([
        deanIncidentService.listCurrentlyUnderway(),
        deanIncidentService.listAwaitingAction(),
        deanIncidentService.listCompleted(),
      ]);
      const nextDatasets = {
        underway: results[0].status === "fulfilled" ? results[0].value.results : [],
        assignment: results[1].status === "fulfilled" ? results[1].value.results : [],
        completed: results[2].status === "fulfilled" ? results[2].value.results : [],
      };
      setDatasets(nextDatasets);
      setActiveView(
        pickDefaultDeanView({
          underway: nextDatasets.underway.length,
          assignment: nextDatasets.assignment.length,
          completed: nextDatasets.completed.length,
        }),
      );
      if (results.some((result) => result.status === "rejected")) {
        setError("Some incident lists could not be loaded. Refresh the page to try again.");
      }
      setIsLoading(false);
    })();
  }, []);

  const counts: Record<DeanQueueView, number> = {
    underway: datasets.underway.length,
    assignment: datasets.assignment.length,
    completed: datasets.completed.length,
  };

  const copy: Record<DeanQueueView, { title: string; empty: string; description: string }> = {
    underway: {
      title: "Currently underway",
      empty: "No incidents are currently underway",
      description:
        "Assigned, in-progress, and resolved reports appear here. Close resolved incidents when work is confirmed.",
    },
    assignment: {
      title: "Needs assignment",
      empty: "No incidents awaiting assignment",
      description: "Verified incidents appear here after administrative review.",
    },
    completed: {
      title: "Completed",
      empty: "No closed incidents yet",
      description: "Incidents you have closed are listed here for reference.",
    },
  };

  const rows = datasets[activeView].map((incident) => toDeanRow(incident, activeView));

  return (
    <PageContainer width="app">
      <section className="py-6 md:py-10">
        <h1 className="mb-5 text-[26px] font-semibold md:mb-6 md:text-[32px]">Overview</h1>

        {isLoading ? (
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
                <DeanReviewQueueTabs
                  activeView={activeView}
                  counts={counts}
                  onChange={setActiveView}
                />
                <h2 className="pb-4 pt-5 text-[18px] font-semibold">{copy[activeView].title}</h2>
              </div>
              <IncidentTable
                showPriority
                showAssigned
                rows={rows}
                emptyTitle={copy[activeView].empty}
                emptyDescription={copy[activeView].description}
                dateLabel={activeView === "completed" ? "Closed" : "Updated"}
              />
            </div>
          </>
        )}
      </section>
    </PageContainer>
  );
}

export default function DeanDashboardPage() {
  return (
    <RequireAuth allowedRoles={["DEAN"]}>
      <DeanDashboardContent />
    </RequireAuth>
  );
}
