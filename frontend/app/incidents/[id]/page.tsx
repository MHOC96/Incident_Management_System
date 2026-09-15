"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { IncidentDetailHeader } from "@/components/incidents/IncidentDetailHeader";
import { IncidentEvidence } from "@/components/incidents/IncidentEvidence";
import { IncidentTimeline } from "@/components/incidents/IncidentTimeline";
import { PageContainer } from "@/components/layout/PageContainer";
import { formatDate } from "@/lib/format";
import { incidentService } from "@/services/incidents";
import type { PublicIncident } from "@/types";

export default function PublicIncidentDetailPage() {
  const params = useParams<{ id: string }>();
  return <PublicIncidentDetailContent key={params.id} />;
}

function PublicIncidentDetailContent() {
  const params = useParams<{ id: string }>();
  const [incident, setIncident] = useState<PublicIncident | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    void (async () => {
      try {
        const data = await incidentService.getPublic(Number(params.id));
        if (!ignore) setIncident(data);
      } catch {
        if (!ignore) setError("This incident could not be found or is not publicly visible.");
      } finally {
        if (!ignore) setIsLoading(false);
      }
    })();
    return () => { ignore = true; };
  }, [params.id]);

  return (
    <PageContainer>
      <section className="mx-auto max-w-[960px] py-6 md:py-8">
        {isLoading ? (
          <div className="animate-pulse space-y-3">
            <div className="h-4 w-1/4 rounded-sm bg-border" />
            <div className="h-8 w-2/3 rounded-sm bg-border" />
          </div>
        ) : error || !incident ? (
          <div role="status">
            <p className="text-sm text-danger">{error}</p>
            <Link
              href="/incidents"
              className="mt-4 inline-flex text-sm font-medium text-primary hover:text-primary-dark"
            >
              Back to public incidents
            </Link>
          </div>
        ) : (
          <>
            <IncidentDetailHeader
              backHref="/incidents"
              backLabel="Back to public incidents"
              incidentNumber={incident.incident_number}
              showIncidentNumber={false}
              title={incident.title}
              voteCount={incident.vote_count}
              status={incident.status}
              location={incident.location}
              category={incident.category}
              showPriority={false}
            />
            <div className="public-detail-layout"><div className="public-incident-summary">
              <div>
                <h2 className="text-[18px] font-semibold mb-2">Description</h2>
                <p className="break-words text-text-secondary whitespace-pre-wrap">
                  {incident.description}
                </p>
                <p className="mt-4 text-sm text-text-muted">
                  Reported on {formatDate(incident.created_at)}
                </p>
              </div>

              {incident.images.length > 0 ? (
                <div className="public-incident-photos">
                  <h2 className="text-[18px] font-semibold mb-2">Incident photo</h2>
                  <IncidentEvidence images={incident.images} title={incident.title} />
                </div>
              ) : null}
              </div><IncidentTimeline incident={incident} />
            </div>
          </>
        )}

      </section>
    </PageContainer>
  );
}
