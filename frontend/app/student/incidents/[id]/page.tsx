"use client";

import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { IncidentEvidence } from "@/components/incidents/IncidentEvidence";
import {
  IncidentPageSkeleton,
  IncidentPageState,
} from "@/components/incidents/IncidentPageState";
import { IncidentStatusBadge } from "@/components/incidents/IncidentStatusBadge";
import { IncidentTimeline } from "@/components/incidents/IncidentTimeline";
import { IncidentWorkflowNotes } from "@/components/incidents/IncidentWorkflowNotes";
import { PageContainer } from "@/components/layout/PageContainer";
import { StudentIncidentEditPanel } from "@/components/student/StudentIncidentEditPanel";
import {
  formatDate,
  formatLocationPlace,
  getVisibilityLabel,
} from "@/lib/format";
import { incidentService } from "@/services/incidents";
import type { StudentIncident } from "@/types";
import Link from "next/link";

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
        <IncidentPageState tone="danger" message={error || "Incident not found."} />
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

  return (
    <PageContainer width="app">
      <section className="student-incident-detail py-4 md:py-6">
        {/* Success banner */}
        {searchParams.get("submitted") ? (
          <div className="mb-4 rounded-md border border-success/30 px-3 py-2.5 text-sm text-success">
            Your report was submitted successfully. Staff will review it soon.
          </div>
        ) : null}

        {/* Back link */}
        <Link
          href="/student/dashboard"
          className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:text-primary-dark"
        >
          ← Back to my reports
        </Link>

        {/* Title + status, with actions aligned to the right */}
        <div className="student-detail-headrow mt-3">
          <div className="min-w-0">
            <h1 className="public-incident-title min-w-0 break-words text-[24px] font-semibold leading-tight md:text-[30px]">
              {incident.title}
              <IncidentStatusBadge status={incident.status} />
            </h1>
            <p className="mt-2 text-sm text-text-secondary">
              <span className="font-medium text-foreground">{locationPlace}</span>
              <span className="text-text-muted"> · </span>
              <span>{incident.category.name}</span>
              <span className="text-text-muted"> · </span>
              <span>Submitted {formatDate(incident.created_at)}</span>
              <span className="text-text-muted"> · </span>
              <span>{getVisibilityLabel(incident.visibility)}</span>
            </p>
          </div>
          <StudentIncidentEditPanel incident={incident} onUpdated={setIncident} />
        </div>

        {/* Content left (description + photo) · progress right */}
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

            {incident.revision_history[0]?.status === "REJECTED" ? (
              <div className="student-detail-card p-3 md:p-4">
                <h2 className="text-base font-semibold">Proposed changes not approved</h2>
                {incident.revision_history[0].review_comment ? (
                  <p className="mt-2 whitespace-pre-wrap text-sm text-text-secondary">
                    {incident.revision_history[0].review_comment}
                  </p>
                ) : (
                  <p className="mt-2 text-sm text-text-secondary">
                    An administrator did not approve your latest edit request. The report
                    still shows the previously accepted details.
                  </p>
                )}
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

        {/* Extras — admin notes, workflow updates, revisions */}
        {incident.admin_review_note ||
        incident.progress_note ||
        incident.resolution_statement ||
        incident.closure_note ||
        incident.reopen_reason ? (
          <div className="mt-3 flex flex-col gap-3">
            {incident.admin_review_note ? (
              <div className="student-detail-card p-3 md:p-4">
                <h2 className="text-base font-semibold">
                  {incident.status === "REJECTED"
                    ? "Why this report was rejected"
                    : "Admin review note"}
                </h2>
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

export default function StudentIncidentDetailPage() {
  return (
    <RequireAuth allowedRoles={["STUDENT"]}>
      <StudentIncidentDetailContent />
    </RequireAuth>
  );
}
