"use client";
import { DetailJumpLinks } from "@/components/incidents/DetailJumpLinks";


import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { DeanAssignPanel } from "@/components/dean/DeanAssignPanel";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { IncidentDetailHeader } from "@/components/incidents/IncidentDetailHeader";
import { IncidentEvidence } from "@/components/incidents/IncidentEvidence";
import {
  IncidentMetaGrid,
  type IncidentMetaItem,
} from "@/components/incidents/IncidentMetaGrid";
import {
  IncidentPageSkeleton,
  IncidentPageState,
} from "@/components/incidents/IncidentPageState";
import { IncidentSection } from "@/components/incidents/IncidentSection";
import { IncidentTimeline } from "@/components/incidents/IncidentTimeline";
import { IncidentWorkflowNotes } from "@/components/incidents/IncidentWorkflowNotes";
import { PageContainer } from "@/components/layout/PageContainer";
import { formatDate } from "@/lib/format";
import { getDeanStatusSummary } from "@/lib/incidentCopy";
import { deanIncidentService } from "@/services/deanIncidents";
import type { DeanIncident } from "@/types";

function buildMetaItems(incident: DeanIncident): IncidentMetaItem[] {
  const items: IncidentMetaItem[] = [
    { label: "Reporter", value: incident.reporter.name },
    { label: "Email", value: incident.reporter.email },
    { label: "Phone", value: incident.reporter.phone || "Not provided" },
    { label: "Submitted", value: formatDate(incident.created_at) },
  ];

  if (incident.current_assignment) {
    items.push({
      label: "Responsible official",
      value: incident.current_assignment.assigned_official_name,
    });
    items.push({
      label: "Assigned",
      value: formatDate(incident.current_assignment.assigned_at),
    });
  }

  if (incident.verified_at) {
    items.push({ label: "Verified", value: formatDate(incident.verified_at) });
  }

  if (incident.resolved_at) {
    items.push({ label: "Resolved", value: formatDate(incident.resolved_at) });
  }

  if (incident.closed_at) {
    items.push({ label: "Closed", value: formatDate(incident.closed_at) });
  }

  return items;
}

function DeanIncidentDetailContent() {
  const params = useParams<{ id: string }>();
  const [incident, setIncident] = useState<DeanIncident | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    void (async () => {
      try {
        const data = await deanIncidentService.getById(Number(params.id));
        if (!ignore) {
          setIncident(data);
        }
      } catch {
        if (!ignore) {
          setError("We couldn't load this incident.");
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    })();
    return () => {
      ignore = true;
    };
  }, [params.id]);

  if (isLoading) {
    return <IncidentPageSkeleton />;
  }

  if (error || !incident) {
    return (
      <IncidentPageState
        message={error || "This incident could not be found."}
        tone="danger"
      />
    );
  }

  const summary = getDeanStatusSummary(
    incident.status,
    incident.current_assignment?.assigned_official_name,
  );

  return (
    <section className="py-6 md:py-10">
      <IncidentDetailHeader
        backHref="/dean/dashboard"
        backLabel="Back to overview"
        incidentNumber={incident.incident_number}
        title={incident.title}
        status={incident.status}
        priority={incident.priority}
        location={incident.location}
        category={incident.category}
        summary={summary}
      />

      <DetailJumpLinks actions /><div className="detail-layout">
        <div className="detail-body">
          <IncidentSection title="Description">
            <p className="break-words whitespace-pre-wrap text-text-secondary">
              {incident.description}
            </p>
            <div className="mt-6 border-t border-border pt-6">
              <h3 className="mb-3 text-sm font-semibold text-foreground">Evidence</h3>
              <IncidentEvidence images={incident.images} title={incident.title} />
            </div>
          </IncidentSection>

          <IncidentSection title="Current details">
            <IncidentMetaGrid items={buildMetaItems(incident)} />
            {incident.current_assignment?.comment ? (
              <div className="mt-5 border-t border-border pt-5">
                <h3 className="mb-2 text-sm font-semibold text-foreground">Assignment note</h3>
                <p className="whitespace-pre-wrap text-sm text-text-secondary">
                  {incident.current_assignment.comment}
                </p>
              </div>
            ) : null}
          </IncidentSection>

          <IncidentTimeline incident={incident} />
          <IncidentWorkflowNotes incident={incident} />
        </div>

        <aside id="incident-actions" tabIndex={-1} className="detail-actions">
          <DeanAssignPanel incident={incident} onUpdated={setIncident} />
        </aside>
      </div>
    </section>
  );
}

export default function DeanIncidentDetailPage() {
  return (
    <RequireAuth allowedRoles={["DEAN"]}>
      <PageContainer width="app">
        <DeanIncidentDetailContent />
      </PageContainer>
    </RequireAuth>
  );
}
