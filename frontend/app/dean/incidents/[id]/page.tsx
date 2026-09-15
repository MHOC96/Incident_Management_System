"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { DeanAssignPanel } from "@/components/dean/DeanAssignPanel";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { IncidentEvidence } from "@/components/incidents/IncidentEvidence";
import { IncidentMetaGrid } from "@/components/incidents/IncidentMetaGrid";
import {
  IncidentPageSkeleton,
  IncidentPageState,
} from "@/components/incidents/IncidentPageState";
import { IncidentPriorityBadge } from "@/components/incidents/IncidentPriorityBadge";
import { IncidentStatusBadge } from "@/components/incidents/IncidentStatusBadge";
import { IncidentTimeline } from "@/components/incidents/IncidentTimeline";
import { IncidentWorkflowNotes } from "@/components/incidents/IncidentWorkflowNotes";
import { PageContainer } from "@/components/layout/PageContainer";
import {
  formatDate,
  formatLocationPlace,
  getVisibilityLabel,
} from "@/lib/format";
import { getDeanStatusSummary } from "@/lib/incidentCopy";
import { deanIncidentService } from "@/services/deanIncidents";
import type { DeanIncident } from "@/types";

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
          message={error || "This incident could not be found."}
          tone="danger"
        />
      </PageContainer>
    );
  }

  const hasPhoto = incident.images.length > 0;
  const locationPlace = formatLocationPlace(incident.location);
  const showProgressMeta = Boolean(
    incident.current_assignment ||
      incident.verified_at ||
      incident.resolved_at ||
      incident.closed_at,
  );
  const summary = getDeanStatusSummary(
    incident.status,
    incident.current_assignment?.assigned_official_name,
  );

  return (
    <PageContainer width="app">
      <section className="student-incident-detail py-4 md:py-6">
        <Link
          href="/dean/dashboard"
          className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:text-primary-dark"
        >
          ← Back to overview
        </Link>

        <div className="student-detail-headrow mt-3">
          <div className="min-w-0">
            <h1 className="public-incident-title min-w-0 break-words text-[24px] font-semibold leading-tight md:text-[30px]">
              {incident.title}
              <IncidentStatusBadge status={incident.status} />
              {incident.priority ? (
                <IncidentPriorityBadge priority={incident.priority} />
              ) : null}
            </h1>
            <p className="mt-2 text-sm text-text-secondary">
              <span className="font-medium text-foreground">{incident.incident_number}</span>
              <span className="text-text-muted"> · </span>
              <span className="font-medium text-foreground">{locationPlace}</span>
              <span className="text-text-muted"> · </span>
              <span>{incident.category.name}</span>
              <span className="text-text-muted"> · </span>
              <span>Submitted {formatDate(incident.created_at)}</span>
              <span className="text-text-muted"> · </span>
              <span>{getVisibilityLabel(incident.visibility)}</span>
            </p>
            <p className="mt-2 text-sm text-text-secondary">{summary}</p>
          </div>
          <DeanAssignPanel incident={incident} onUpdated={setIncident} />
        </div>

        <div className="student-detail-grid">
          <div className="student-detail-main">
            <div className="student-detail-card p-3 md:p-4">
              <h2 className="text-base font-semibold">Description</h2>
              <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-relaxed text-text-secondary md:text-[15px]">
                {incident.description}
              </p>
            </div>

            {hasPhoto ? (
              <div className="student-detail-card p-3 md:p-4">
                <h2 className="mb-2 text-base font-semibold">Photo</h2>
                <IncidentEvidence images={incident.images} title={incident.title} compact />
              </div>
            ) : null}

            <div className="student-detail-card p-3 md:p-4">
              <h2 className="text-base font-semibold">Reporter information</h2>
              <div className="mt-3">
                <IncidentMetaGrid
                  items={[
                    { label: "Name", value: incident.reporter.name },
                    { label: "Email", value: incident.reporter.email },
                    { label: "Phone", value: incident.reporter.phone || "Not provided" },
                    { label: "MC number", value: incident.reporter.mc_number },
                  ]}
                />
              </div>
            </div>

            {incident.current_assignment?.comment ? (
              <div className="student-detail-card p-3 md:p-4">
                <h2 className="text-base font-semibold">Assignment note</h2>
                <p className="mt-2 whitespace-pre-wrap text-sm text-text-secondary">
                  {incident.current_assignment.comment}
                </p>
              </div>
            ) : null}
          </div>

          <aside className="student-detail-side">
            <div className="student-detail-card p-3 md:p-4">
              {showProgressMeta ? (
                <dl className="mb-3 grid gap-x-4 gap-y-2 border-b border-border pb-3 text-sm">
                  {incident.current_assignment ? (
                    <div className="min-w-0">
                      <dt className="text-text-muted">Assigned to</dt>
                      <dd className="font-medium text-foreground">
                        {incident.current_assignment.assigned_official_name}
                      </dd>
                    </div>
                  ) : null}
                  {incident.verified_at ? (
                    <div>
                      <dt className="text-text-muted">Verified</dt>
                      <dd className="font-medium">{formatDate(incident.verified_at)}</dd>
                    </div>
                  ) : null}
                  {incident.resolved_at ? (
                    <div>
                      <dt className="text-text-muted">Resolved</dt>
                      <dd className="font-medium">{formatDate(incident.resolved_at)}</dd>
                    </div>
                  ) : null}
                  {incident.closed_at ? (
                    <div>
                      <dt className="text-text-muted">Closed</dt>
                      <dd className="font-medium">{formatDate(incident.closed_at)}</dd>
                    </div>
                  ) : null}
                </dl>
              ) : null}
              <IncidentTimeline incident={incident} compact />
            </div>
          </aside>
        </div>

        {incident.admin_review_note ||
        incident.progress_note ||
        incident.resolution_statement ||
        incident.closure_note ||
        incident.reopen_reason ? (
          <div className="mt-3 flex flex-col gap-3">
            {incident.admin_review_note ? (
              <div className="student-detail-card p-3 md:p-4">
                <h2 className="text-base font-semibold">Admin review note</h2>
                <p className="mt-2 whitespace-pre-wrap text-sm text-text-secondary">
                  {incident.admin_review_note}
                </p>
              </div>
            ) : null}

            <IncidentWorkflowNotes incident={incident} />
          </div>
        ) : null}
      </section>
    </PageContainer>
  );
}

export default function DeanIncidentDetailPage() {
  return (
    <RequireAuth allowedRoles={["DEAN"]}>
      <DeanIncidentDetailContent />
    </RequireAuth>
  );
}
