"use client";

import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { IncidentDetailHeader } from "@/components/incidents/IncidentDetailHeader";
import { IncidentEvidence } from "@/components/incidents/IncidentEvidence";
import { IncidentRevisionPanel } from "@/components/incidents/IncidentRevisionPanel";
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
import { StudentIncidentEditPanel } from "@/components/student/StudentIncidentEditPanel";
import { formatDate, getVisibilityLabel } from "@/lib/format";
import { incidentService } from "@/services/incidents";
import type { StudentIncident } from "@/types";

function buildMetaItems(incident: StudentIncident): IncidentMetaItem[] {
  const items: IncidentMetaItem[] = [
    { label: "Submitted", value: formatDate(incident.created_at) },
    { label: "Visibility", value: getVisibilityLabel(incident.visibility) },
  ];

  if (incident.current_assignment) {
    items.push({
      label: "Assigned to",
      value: incident.current_assignment.assigned_official_name,
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

function StudentIncidentDetailContent() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const [incident, setIncident] = useState<StudentIncident | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    void (async () => {
      try {
        const data = await incidentService.getById(Number(params.id));
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
    return (
      <PageContainer width="app">
        <IncidentPageSkeleton />
      </PageContainer>
    );
  }

  if (error || !incident) {
    return (
      <PageContainer width="app">
        <IncidentPageState
          tone="danger"
          message={error || "Incident not found."}
        />
      </PageContainer>
    );
  }

  const metaItems = buildMetaItems(incident);

  return (
    <PageContainer width="app">
      <section className="py-6 md:py-10">
        {searchParams.get("submitted") ? (
          <div className="mb-5 rounded-md border border-success/30 px-4 py-3 text-sm text-success">
            Your report was submitted successfully. Staff will review it soon.
          </div>
        ) : null}

        <IncidentDetailHeader
          backHref="/student/dashboard"
          backLabel="Back to my reports"
          incidentNumber={incident.incident_number}
          showIncidentNumber={false}
          title={incident.title}
          status={incident.status}
          priority={incident.priority}
          location={incident.location}
          category={incident.category}
          showPriority={false}
          showBorderBottom={false}
        />

        <div className="mt-5 flex flex-col gap-5 lg:mt-6">
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,22rem)] lg:items-start">
            <IncidentSection title="Your report">
              <p className="whitespace-pre-wrap break-words text-sm text-text-secondary md:text-[15px]">
                {incident.description}
              </p>
              {incident.images.length > 0 ? (
                <div className="mt-5 border-t border-border pt-5">
                  <h3 className="mb-3 text-sm font-medium text-foreground">Photo evidence</h3>
                  <IncidentEvidence images={incident.images} title={incident.title} />
                </div>
              ) : null}
            </IncidentSection>

            <div className="flex flex-col gap-5">
              <IncidentSection title="Details">
                <IncidentMetaGrid items={metaItems} />
              </IncidentSection>
              <IncidentTimeline incident={incident} />
            </div>
          </div>
          {incident.admin_review_note ? (
            <IncidentSection title={incident.status === "REJECTED" ? "Why this report was rejected" : "Admin review note"}>
              <p className="whitespace-pre-wrap text-sm text-text-secondary">{incident.admin_review_note}</p>
            </IncidentSection>
          ) : null}
          <IncidentWorkflowNotes incident={incident} />
          {incident.pending_revision ? <IncidentRevisionPanel revision={incident.pending_revision} /> : null}
          {!incident.pending_revision && incident.revision_history[0] && incident.revision_history[0].status !== "PENDING" ? (
            <IncidentRevisionPanel revision={incident.revision_history[0]} title="Latest change review" />
          ) : null}
          <StudentIncidentEditPanel incident={incident} onUpdated={setIncident} />
        </div>
      </section>
    </PageContainer>
  );
}

export default function StudentIncidentDetailPage() {
  return (
    <RequireAuth allowedRoles={["STUDENT"]}>
      <StudentIncidentDetailContent />
    </RequireAuth>
  );
}
