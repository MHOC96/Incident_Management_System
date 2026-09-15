"use client";

import { useEffect, useState } from "react";
import { useIncidentQueue } from "@/hooks/useIncidentQueue";
import { Pagination } from "@/components/ui/Pagination";
import { apiClient } from "@/lib/api";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { IncidentTable } from "@/components/dashboard/IncidentTable";
import { StatsStrip } from "@/components/dashboard/StatsStrip";
import { PageContainer } from "@/components/layout/PageContainer";
import { LinkButton } from "@/components/ui/LinkButton";
import type { IncidentDetail } from "@/types";

const QUEUES = { mine: "/incidents/" };
function StudentDashboardContent() {
  const { items: incidents, isLoading, error, page, count, setPage } = useIncidentQueue<"mine", IncidentDetail>(QUEUES, "mine", false);
  const [stats, setStats] = useState({ total: 0, underReview: 0, inProgress: 0, resolved: 0 });
  useEffect(() => {
    const controller = new AbortController();
    void apiClient.get<typeof stats>("/incidents/queue-counts/", { signal: controller.signal }).then(setStats).catch(() => {});
    return () => controller.abort();
  }, []);

  return (
    <PageContainer width="app">
      <section className="py-8 md:py-10">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-[26px] font-semibold md:text-[32px]">My reports</h1>
          <LinkButton href="/student/incidents/new" className="w-full shrink-0 sm:w-auto">
            Report an incident
          </LinkButton>
        </div>

        {isLoading ? (
          <div className="animate-pulse space-y-4">
            <div className="h-24 border border-border bg-surface" />
            <div className="h-40 border border-border bg-surface" />
          </div>
        ) : error ? (
          <p className="text-sm text-danger">{error}</p>
        ) : (
          <>
            <StatsStrip
              items={[
                { value: stats.total, label: "Total reports" },
                { value: stats.underReview, label: "Under review" },
                { value: stats.inProgress, label: "In progress" },
                { value: stats.resolved, label: "Resolved" },
              ]}
            />

            {incidents.length === 0 ? (
              <div className="border border-border bg-surface px-4 py-8 md:px-6 md:py-10">
                <p className="text-text-secondary mb-4">
                  You haven&apos;t reported any incidents yet.
                </p>
                <LinkButton href="/student/incidents/new" className="w-full sm:w-auto">
                  Report new incident
                </LinkButton>
              </div>
            ) : (
              <div className="border border-border bg-surface">
                <div className="flex flex-col gap-3 border-b border-border px-4 py-4 sm:flex-row sm:items-center sm:justify-between md:px-6">
                  <h2 className="text-[18px] font-semibold">Recent reports</h2>

                </div>
                <IncidentTable
                  rows={incidents.map((incident) => ({
                    id: incident.id,
                    incident_number: incident.incident_number,
                    title: incident.title,
                    status: incident.status,
                    location: incident.location,
                    href: `/student/incidents/${incident.id}`,
                    date: incident.created_at,
                  }))}
                  emptyTitle="You haven't reported any incidents yet."
                  emptyDescription="Submit a report when you notice a problem on campus."
                  showIncidentNumber={false}
                />
                <Pagination page={page} count={count} onChange={setPage} />
              </div>
            )}
          </>
        )}
      </section>
    </PageContainer>
  );
}

export default function StudentDashboardPage() {
  return (
    <RequireAuth allowedRoles={["STUDENT"]}>
      <StudentDashboardContent />
    </RequireAuth>
  );
}
