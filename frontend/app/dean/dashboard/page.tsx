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
import { LinkButton } from "@/components/ui/LinkButton";
import { deanIncidentService } from "@/services/deanIncidents";
import type { DeanIncident } from "@/types";

function toDeanRow(incident: DeanIncident): IncidentTableRow {
  return {
    id: incident.id,
    incident_number: incident.incident_number,
    title: incident.title,
    status: incident.status,
    priority: incident.priority,
    location: incident.location,
    href: `/dean/incidents/${incident.id}`,
    date: incident.updated_at,
    assignedTo: incident.current_assignment?.assigned_official_name,
  };
}

function DeanDashboardContent() {
  const [datasets, setDatasets] = useState<Record<DeanQueueView, DeanIncident[]>>({
    underway: [],
    assignment: [],
    close: [],
  });
  const [activeView, setActiveView] = useState<DeanQueueView>("underway");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      const results = await Promise.allSettled([
        deanIncidentService.listCurrentlyUnderway(),
        deanIncidentService.listAwaitingAction(),
        deanIncidentService.listResolvedAwaitingClosure(),
      ]);
      const nextDatasets = {
        underway: results[0].status === "fulfilled" ? results[0].value.results : [],
        assignment: results[1].status === "fulfilled" ? results[1].value.results : [],
        close: results[2].status === "fulfilled" ? results[2].value.results : [],
      };
      setDatasets(nextDatasets);
      setActiveView(
        pickDefaultDeanView({
          underway: nextDatasets.underway.length,
          assignment: nextDatasets.assignment.length,
          close: nextDatasets.close.length,
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
    close: datasets.close.length,
  };

  const copy: Record<DeanQueueView, { title: string; empty: string; description: string }> = {
    underway: {
      title: "Currently underway",
      empty: "No incidents are currently underway",
      description: "Assigned and in-progress reports will appear here after you assign an official.",
    },
    assignment: {
      title: "Needs assignment",
      empty: "No incidents awaiting assignment",
      description: "Verified incidents appear here after administrative review.",
    },
    close: {
      title: "Ready to close",
      empty: "No resolved incidents awaiting closure",
      description: "Incidents marked resolved by officials will appear here for final review.",
    },
  };

  const rows = datasets[activeView].map(toDeanRow);

  return (
    <PageContainer width="app">
      <section className="py-6 md:py-10">
        <div className="mb-5 flex justify-end md:mb-6">
          <LinkButton href="/dean/users" variant="secondary" className="w-full sm:w-auto">
            Manage officials
          </LinkButton>
        </div>

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
                dateLabel="Updated"
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
