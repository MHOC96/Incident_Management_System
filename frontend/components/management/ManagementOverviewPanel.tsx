import type { ReactNode } from "react";
import { getPositionLabel } from "@/lib/format";
import type { ManagementOverview } from "@/types";

type ManagementOverviewPanelProps = {
  data: ManagementOverview | null;
  isLoading: boolean;
  error: string | null;
};

function OverviewMetric({
  title,
  children,
  accent,
}: {
  title: string;
  children: ReactNode;
  accent?: "urgency";
}) {
  return (
    <div
      className={`min-w-0 border border-border px-4 py-4 md:px-5 md:py-5 ${
        accent === "urgency" ? "bg-[#fce8e6]" : "bg-surface"
      }`}
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">{title}</p>
      <div className="mt-2 text-[15px] leading-snug md:text-base">{children}</div>
    </div>
  );
}

function formatAuthorityLabel(name: string, position: string): string {
  const label = getPositionLabel(position);
  if (label === "Position not set") {
    return name.trim() || "Unnamed authority";
  }
  return `${name.trim() || "Unnamed authority"} — ${label}`;
}

export function ManagementOverviewPanel({
  data,
  isLoading,
  error,
}: ManagementOverviewPanelProps) {
  if (isLoading && !data) {
    return (
      <p className="mb-6 text-sm text-text-secondary" role="status">
        Loading overview metrics…
      </p>
    );
  }

  if (error) {
    return (
      <p
        className="mb-6 rounded-md border border-warning/20 bg-warning/5 px-3 py-2 text-sm text-warning"
        role="status"
      >
        {error}
      </p>
    );
  }

  if (!data) {
    return null;
  }

  const categoryLine =
    data.top_categories.length > 0
      ? data.top_categories.map((item) => item.name).join(" | ")
      : "No category data yet";

  return (
    <div className="mb-8 space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <OverviewMetric title="Complaint vs suggestion">
          <p>
            <span className="font-semibold">Complaints:</span> {data.complaints}
            <span className="mx-2 text-text-secondary">/</span>
            <span className="font-semibold">Suggestions:</span> {data.suggestions}
          </p>
        </OverviewMetric>
        <OverviewMetric title="Priority" accent="urgency">
          <dl className="grid grid-cols-2 gap-4">
            <div className="min-w-0">
              <dd className="text-[22px] font-semibold leading-none tabular-nums">
                {data.priority_high}
              </dd>
              <dt className="mt-1.5 text-sm leading-snug text-text-secondary">
                High or critical
              </dt>
            </div>
            <div className="min-w-0">
              <dd className="text-[22px] font-semibold leading-none tabular-nums">
                {data.priority_standard}
              </dd>
              <dt className="mt-1.5 text-sm leading-snug text-text-secondary">Low or medium</dt>
            </div>
          </dl>
        </OverviewMetric>
        <OverviewMetric title="Resolution rate">
          <p className="text-[22px] font-semibold leading-none">{data.resolution_rate}%</p>
        </OverviewMetric>
        <OverviewMetric title="Average resolution days">
          <p className="text-[22px] font-semibold leading-none">{data.average_resolution_days} days</p>
        </OverviewMetric>
      </div>

      <div className="border border-border bg-surface px-4 py-4 md:px-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
          Top categories
        </p>
        <p className="mt-2 text-sm md:text-[15px]">{categoryLine}</p>
      </div>

      <div className="border border-border bg-surface">
        <div className="border-b border-border px-4 py-3 md:px-5">
          <h2 className="text-[16px] font-semibold md:text-[18px]">Authority-wise pending cases</h2>
        </div>
        {data.authorities.length === 0 ? (
          <p className="px-4 py-6 text-sm text-text-secondary md:px-5">
            No open assignments with responsible authorities yet.
          </p>
        ) : (
          <div className="incident-table">
            <div className="incident-table-records divide-y divide-border">
              {data.authorities.map((row) => (
                <div key={row.id} className="grid gap-2 px-4 py-4 text-sm md:px-5">
                  <p className="font-semibold">{formatAuthorityLabel(row.name, row.position)}</p>
                  <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-text-secondary">
                    <div>
                      <dt className="inline">Assigned: </dt>
                      <dd className="inline font-medium text-text-primary">{row.assigned_total}</dd>
                    </div>
                    <div>
                      <dt className="inline">In progress: </dt>
                      <dd className="inline font-medium text-text-primary">{row.in_progress}</dd>
                    </div>
                    <div>
                      <dt className="inline">Not started: </dt>
                      <dd className="inline font-medium text-text-primary">{row.not_started}</dd>
                    </div>
                    <div>
                      <dt className="inline">Average age: </dt>
                      <dd className="inline font-medium text-text-primary">
                        {row.average_age_days} days
                      </dd>
                    </div>
                  </dl>
                </div>
              ))}
            </div>
            <div className="incident-table-grid overflow-x-auto">
              <table className="w-full min-w-[640px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-border bg-surface-hover/40">
                    <th className="px-4 py-3 font-semibold md:px-5">Authority</th>
                    <th className="px-4 py-3 font-semibold md:px-5">Assigned</th>
                    <th className="px-4 py-3 font-semibold md:px-5">In progress</th>
                    <th className="px-4 py-3 font-semibold md:px-5">Not started</th>
                    <th className="px-4 py-3 font-semibold md:px-5">Average age</th>
                  </tr>
                </thead>
                <tbody>
                  {data.authorities.map((row) => (
                    <tr key={row.id} className="border-b border-border last:border-b-0">
                      <td className="px-4 py-3 md:px-5">
                        {formatAuthorityLabel(row.name, row.position)}
                      </td>
                      <td className="px-4 py-3 md:px-5">{row.assigned_total}</td>
                      <td className="px-4 py-3 md:px-5">{row.in_progress}</td>
                      <td className="px-4 py-3 md:px-5">{row.not_started}</td>
                      <td className="px-4 py-3 md:px-5">{row.average_age_days} days</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
