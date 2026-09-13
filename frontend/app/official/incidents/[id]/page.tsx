"use client";

import { DetailJumpLinks } from "@/components/incidents/DetailJumpLinks";
import { IncidentDetailHeader } from "@/components/incidents/IncidentDetailHeader";
import { IncidentEvidence } from "@/components/incidents/IncidentEvidence";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { RequireAuth } from "@/components/auth/RequireAuth";


import { IncidentTimeline } from "@/components/incidents/IncidentTimeline";
import { IncidentWorkflowNotes } from "@/components/incidents/IncidentWorkflowNotes";
import { PageContainer } from "@/components/layout/PageContainer";
import { OfficialProgressPanel } from "@/components/official/OfficialProgressPanel";
import { formatDate } from "@/lib/format";
import { officialIncidentService } from "@/services/officialIncidents";
import type { OfficialIncident } from "@/types";

function OfficialIncidentDetailContent() {
  const params = useParams<{ id: string }>();
  const [incident, setIncident] = useState<OfficialIncident | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    void (async () => {
      try {
        const data = await officialIncidentService.getById(Number(params.id));
        if (!ignore) {
          setIncident(data);
        }
      } catch {
        if (!ignore) {
          setError("We couldn't load this assigned incident.");
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
    return <p className="py-16 text-sm text-text-secondary">Loading incident...</p>;
  }

  if (error || !incident) {
    return <p className="py-16 text-sm text-danger">{error}</p>;
  }

  return (
    <section className="py-10">
      <IncidentDetailHeader
        backHref="/official/dashboard"
        backLabel="Back to assigned incidents"
        incidentNumber={incident.incident_number}
        title={incident.title}
        status={incident.status}
        priority={incident.priority}
        location={incident.location}
        category={incident.category}
      />
      <DetailJumpLinks actions />
      <div className="detail-layout">
        <div className="detail-body">
          <div className="rounded-lg border border-border bg-surface p-4 md:p-6">
            <h2 className="text-[18px] font-semibold mb-2">Description</h2>
            <p className="break-words text-text-secondary whitespace-pre-wrap">{incident.description}</p>

            {incident.images.length > 0 ? (
              <div className="mt-6 border-t border-border pt-6">
                <h3 className="text-[18px] font-semibold mb-2">Evidence</h3>
                <IncidentEvidence images={incident.images} title={incident.title} />
              </div>
            ) : null}

            {incident.current_assignment?.comment ? (
              <div className="mt-6 border-t border-border pt-6">
                <h3 className="text-[18px] font-semibold mb-2">Assignment note</h3>
                <p className="text-sm text-text-secondary whitespace-pre-wrap">
                  {incident.current_assignment.comment}
                </p>
                <p className="mt-2 text-sm text-text-muted">
                  Assigned by {incident.current_assignment.assigned_by_name} on{" "}
                  {formatDate(incident.current_assignment.assigned_at)}
                </p>
              </div>
            ) : null}
          </div>

          <IncidentTimeline incident={incident} />
          <IncidentWorkflowNotes incident={incident} />
        </div>

        <div id="incident-actions" tabIndex={-1} className="detail-actions">
          <OfficialProgressPanel incident={incident} onUpdated={setIncident} />
        </div>
      </div>
    </section>
  );
}

export default function OfficialIncidentDetailPage() {
  return (
    <RequireAuth allowedRoles={["OFFICIAL"]}>
      <PageContainer width="app">
        <OfficialIncidentDetailContent />
      </PageContainer>
    </RequireAuth>
  );
}
