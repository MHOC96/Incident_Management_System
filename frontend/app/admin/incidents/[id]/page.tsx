"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AdminChangeReviewsDialog } from "@/components/admin/AdminChangeReviewsDialog";
import { AdminReviewActions } from "@/components/admin/AdminReviewActions";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { IncidentEvidence } from "@/components/incidents/IncidentEvidence";
import { IncidentMetaGrid } from "@/components/incidents/IncidentMetaGrid";
import {
  IncidentPageSkeleton,
  IncidentPageState,
} from "@/components/incidents/IncidentPageState";
import { IncidentPriorityBadge } from "@/components/incidents/IncidentPriorityBadge";
import { IncidentRevisionPanel } from "@/components/incidents/IncidentRevisionPanel";
import { IncidentStatusBadge } from "@/components/incidents/IncidentStatusBadge";
import { IncidentTimeline } from "@/components/incidents/IncidentTimeline";
import { PageContainer } from "@/components/layout/PageContainer";
import {
  formatDate,
  formatDateTimeColombo,
  formatLocationPlace,
  getVisibilityLabel,
} from "@/lib/format";
import { adminIncidentService } from "@/services/adminIncidents";
import type { AdminIncidentReview } from "@/types";

type AdminIncidentBodyProps = {
  incident: AdminIncidentReview;
  onUpdated: (incident: AdminIncidentReview) => void;
  showFullRecord: boolean;
  incidentId: number;
};

function AdminIncidentFullBody({
  incident,
  onUpdated,
  showFullRecord,
  incidentId,
}: AdminIncidentBodyProps) {
  const hasPhoto = incident.images.length > 0;
  const locationPlace = formatLocationPlace(incident.location);
  const showProgressMeta = Boolean(
    incident.verified_at || incident.resolved_at || incident.closed_at,
  );
  const pending = incident.pending_revision;
  const changesFocus = pending && !showFullRecord;

  if (changesFocus && pending) {
    return (
      <>
        <div className="student-detail-headrow mt-3">
          <div className="min-w-0">
            <h1 className="text-[24px] font-semibold leading-tight md:text-[28px]">
              Review proposed changes
            </h1>
            <p className="mt-2 text-sm text-text-secondary">
              <span className="font-medium text-foreground">{incident.incident_number}</span>
              <span className="text-text-muted"> · </span>
              <span>{incident.reporter.name}</span>
              <span className="text-text-muted"> · </span>
              <span>MC {incident.reporter.mc_number}</span>
              <span className="text-text-muted"> · </span>
              <span>Submitted {formatDateTimeColombo(pending.submitted_at)}</span>
            </p>
            <p className="mt-2 text-sm text-text-secondary">
              Compare what is on record today with what the student is asking to change.
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
            <AdminChangeReviewsDialog revisions={incident.revision_history} />
            <AdminReviewActions incident={incident} onUpdated={onUpdated} />
          </div>
        </div>

        <div className="mt-4">
          <IncidentRevisionPanel
            revision={pending}
            title="Proposed changes"
            variant="workspace"
          />
        </div>

        <div className="student-detail-card mt-3 p-3 md:p-4">
          <h2 className="text-base font-semibold">Reporter contact</h2>
          <div className="mt-3">
            <IncidentMetaGrid
              items={[
                { label: "Email", value: incident.reporter.email },
                { label: "Phone", value: incident.reporter.phone },
              ]}
            />
          </div>
        </div>

        <p className="mt-4">
          <Link
            href={`/admin/incidents/${incidentId}?view=full`}
            className="text-sm font-medium text-primary hover:text-primary-dark"
          >
            View full incident record →
          </Link>
        </p>
      </>
    );
  }

  return (
    <>
      {pending ? (
        <p className="mt-3">
          <Link
            href={`/admin/incidents/${incidentId}`}
            className="text-sm font-medium text-primary hover:text-primary-dark"
          >
            ← Back to proposed changes
          </Link>
        </p>
      ) : null}

      <div className={`student-detail-headrow ${pending ? "mt-2" : "mt-3"}`}>
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
        </div>
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
          <AdminChangeReviewsDialog revisions={incident.revision_history} />
          {!pending ? <AdminReviewActions incident={incident} onUpdated={onUpdated} /> : null}
        </div>
      </div>

      {pending ? (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-sm border border-primary/25 bg-primary/5 px-3 py-2.5">
          <p className="text-sm text-text-secondary">
            This incident has proposed changes awaiting a decision.
          </p>
          <AdminReviewActions incident={incident} onUpdated={onUpdated} />
        </div>
      ) : null}

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
                  { label: "Phone", value: incident.reporter.phone },
                  { label: "MC number", value: incident.reporter.mc_number },
                ]}
              />
            </div>
          </div>
        </div>

        <aside className="student-detail-side">
          <div className="student-detail-card p-3 md:p-4">
            {showProgressMeta ? (
              <dl className="mb-3 grid gap-x-4 gap-y-2 border-b border-border pb-3 text-sm">
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

      {!pending && incident.admin_review_note ? (
        <div className="mt-3 student-detail-card p-3 md:p-4">
          <h2 className="text-base font-semibold">Admin review note</h2>
          <p className="mt-2 whitespace-pre-wrap text-sm text-text-secondary">
            {incident.admin_review_note}
          </p>
        </div>
      ) : null}
    </>
  );
}

function AdminIncidentReviewContent() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const incidentId = Number(params.id);
  const showFullRecord = searchParams.get("view") === "full";
  const [incident, setIncident] = useState<AdminIncidentReview | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    void (async () => {
      try {
        const data = await adminIncidentService.getForReview(incidentId);
        if (!ignore) {
          setIncident(data);
        }
      } catch {
        if (!ignore) {
          setError("We couldn't load this incident for review.");
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
  }, [incidentId]);

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

  return (
    <PageContainer width="app">
      <section className="student-incident-detail py-4 md:py-6">
        <Link
          href="/admin/dashboard"
          className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:text-primary-dark"
        >
          ← Back to review queue
        </Link>

        <AdminIncidentFullBody
          incident={incident}
          onUpdated={setIncident}
          showFullRecord={showFullRecord}
          incidentId={incidentId}
        />
      </section>
    </PageContainer>
  );
}

export default function AdminIncidentReviewPage() {
  const params = useParams<{ id: string }>();
  return (
    <RequireAuth allowedRoles={["ADMIN"]}>
      <AdminIncidentReviewContent key={params.id} />
    </RequireAuth>
  );
}
