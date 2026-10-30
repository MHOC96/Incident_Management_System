"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { AuthorityProgressPanel } from "@/components/authority/AuthorityProgressPanel";
import { CasePriorityDisplay } from "@/components/incidents/CasePriorityDisplay";
import { IncidentEvidence } from "@/components/incidents/IncidentEvidence";
import {
  IncidentPageSkeleton,
  IncidentPageState,
} from "@/components/incidents/IncidentPageState";
import { IncidentStatusBadge } from "@/components/incidents/IncidentStatusBadge";
import { IncidentTimeline } from "@/components/incidents/IncidentTimeline";
import { PageContainer } from "@/components/layout/PageContainer";
import { useAuth } from "@/hooks/useAuth";
import {
  formatDate,
  formatDateTimeColombo,
  formatLocationPlace,
  getCaseTypeLabel,
  getVisibilityLabel,
} from "@/lib/format";
import { officialIncidentService } from "@/services/authorityIncidents";
import type { OfficialIncident } from "@/types";

function MetaItem({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-medium text-text-muted">{label}</dt>
      <dd className="mt-0.5 text-sm font-medium text-foreground">{value}</dd>
    </div>
  );
}

function OfficialIncidentDetailContent() {
  const params = useParams<{ id: string }>();
  const { user } = useAuth();
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
          setError("We couldn't load this assigned case.");
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
          message={error || "This case could not be found."}
          tone="danger"
        />
      </PageContainer>
    );
  }

  const hasEvidence = incident.images.length > 0;
  const locationPlace = formatLocationPlace(incident.location);
  const assignment = incident.current_assignment;
  const assignmentComment = assignment?.comment?.trim();

  return (
    <PageContainer width="app">
      <section className="student-incident-detail authority-incident-detail py-4 md:py-6">
        <Link
          href="/authority/dashboard"
          className="inline-flex min-h-11 items-center gap-1 text-sm font-medium text-primary hover:text-primary-dark"
        >
          ← Back to assigned cases
        </Link>

        <header className="authority-detail-header mt-3 min-w-0 pb-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">
            Assigned case · {incident.incident_number}
          </p>
          <h1 className="mt-1 min-w-0 break-words text-[22px] font-semibold leading-snug md:text-[28px]">
            {incident.title}
          </h1>
          <div className="authority-detail-badges mt-3 flex flex-wrap items-center gap-2">
            <IncidentStatusBadge status={incident.status} />
            <CasePriorityDisplay
              officialPriority={incident.priority}
              urgencySource="official"
            />
          </div>

          <p className="mt-2 text-sm leading-relaxed text-text-secondary">
            <span className="font-medium text-foreground">{getCaseTypeLabel(incident.case_type)}</span>
            <span className="text-text-muted"> · </span>
            {incident.category.name}
            <span className="text-text-muted"> · </span>
            {locationPlace}
            <span className="text-text-muted"> · </span>
            Submitted {formatDate(incident.created_at)}
            <span className="text-text-muted"> · </span>
            {getVisibilityLabel(incident.visibility)}
          </p>
        </header>

        <div className="mt-4 student-detail-card p-3 md:p-4">
          <AuthorityProgressPanel incident={incident} onUpdated={setIncident} />
        </div>

        <div className="authority-detail-layout">
          <aside className="authority-detail-summary student-detail-card p-3 md:p-4">
            <h2 className="text-base font-semibold">Assignment summary</h2>
            <dl className="mt-3 grid grid-cols-1 gap-x-4 gap-y-3 text-sm sm:grid-cols-2 md:grid-cols-1">
              {user ? (
                <MetaItem label="Assigned to you" value={user.name} />
              ) : null}
              {assignment?.assigned_at ? (
                <MetaItem
                  label="Assigned on"
                  value={formatDateTimeColombo(assignment.assigned_at)}
                />
              ) : null}
              {assignment?.assigned_by_name ? (
                <MetaItem label="Assigned by" value={assignment.assigned_by_name} />
              ) : null}
              <div className="min-w-0 sm:col-span-2 md:col-span-1">
                <dt className="text-xs font-medium text-text-muted">Assigned priority</dt>
                <dd className="mt-1">
                  <CasePriorityDisplay
                    officialPriority={incident.priority}
                    urgencySource="official"
                  />
                </dd>
              </div>
              {incident.verified_at ? (
                <MetaItem label="Accepted for action" value={formatDate(incident.verified_at)} />
              ) : null}
            </dl>
            {assignmentComment ? (
              <div className="mt-4 border-t border-border pt-3">
                <p className="text-sm font-semibold text-foreground">Administrator instructions</p>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-text-secondary">
                  {assignmentComment}
                </p>
              </div>
            ) : null}
          </aside>

          <div className="authority-detail-main flex flex-col gap-3">
            <div className="student-detail-card p-3 md:p-4">
              <h2 className="text-base font-semibold">Description</h2>
              <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-relaxed text-text-secondary md:text-[15px]">
                {incident.description}
              </p>
            </div>

            {hasEvidence ? (
              <div className="student-detail-card p-3 md:p-4">
                <h2 className="mb-2 text-base font-semibold">Evidence</h2>
                <IncidentEvidence images={incident.images} title={incident.title} compact />
              </div>
            ) : null}

            {incident.admin_review_note ? (
              <div className="student-detail-card p-3 md:p-4">
                <h2 className="text-base font-semibold">Administrator review note</h2>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-text-secondary">
                  {incident.admin_review_note}
                </p>
              </div>
            ) : null}
          </div>

          <aside className="authority-detail-timeline student-detail-card p-3 md:p-4">
            <h2 className="mb-3 text-base font-semibold">Progress</h2>
            <IncidentTimeline incident={incident} compact />
          </aside>
        </div>
      </section>
    </PageContainer>
  );
}

export default function OfficialIncidentDetailPage() {
  const params = useParams<{ id: string }>();
  return (
    <RequireAuth allowedRoles={["AUTHORITY"]}>
      <OfficialIncidentDetailContent key={params.id} />
    </RequireAuth>
  );
}
