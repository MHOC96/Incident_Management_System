import Link from "next/link";
import { CasePriorityDisplay } from "@/components/incidents/CasePriorityDisplay";
import { IncidentStatusBadge } from "@/components/incidents/IncidentStatusBadge";
import { formatDate, formatLocationLabel } from "@/lib/format";
import type { IncidentPriority, IncidentStatus, Location, ReporterPriority } from "@/types";

export type IncidentTableRow = {
  id: number;
  incident_number: string;
  title: string;
  status: IncidentStatus;
  priority?: IncidentPriority | null;
  reporterPriority?: ReporterPriority | null;
  location?: Location;
  href: string;
  date: string;
  reporter?: string;
  category?: string;
  assignedTo?: string;
};

type IncidentTableProps = {
  rows: IncidentTableRow[];
  emptyTitle: string;
  emptyDescription: string;
  isLoading?: boolean;
  showPriority?: boolean;
  /** ADMIN: reporter urgency; other roles: administrator-assigned priority. */
  urgencySource?: "reporter" | "official";
  /** @deprecated Use urgencySource="official" */
  officialPriorityOnly?: boolean;
  priorityLabel?: string;
  dateLabel?: string;
  showReporter?: boolean;
  showCategory?: boolean;
  showAssigned?: boolean;
  showIncidentNumber?: boolean;
};

export function IncidentTable({
  rows,
  emptyTitle,
  emptyDescription,
  isLoading = false,
  showPriority = false,
  urgencySource: urgencySourceProp,
  officialPriorityOnly = false,
  priorityLabel = "Priority",
  dateLabel = "Submitted",
  showReporter = false,
  showCategory = false,
  showAssigned = false,
  showIncidentNumber = true,
}: IncidentTableProps) {
  const urgencySource =
    urgencySourceProp ?? (officialPriorityOnly ? "official" : "official");
  if (rows.length === 0) {
    return (
      <div className="px-4 py-8 md:px-6 md:py-10">
        {isLoading ? (
          <div className="animate-pulse space-y-3" aria-busy="true" aria-label="Loading cases">
            <div className="h-4 w-1/3 rounded-sm bg-border" />
            <div className="h-6 w-2/3 rounded-sm bg-border" />
            <div className="h-4 w-1/2 rounded-sm bg-border" />
          </div>
        ) : (
          <>
            <p className="font-medium text-foreground">{emptyTitle}</p>
            <p className="mt-1 text-sm text-text-secondary">{emptyDescription}</p>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="incident-table">
      <div className="incident-table-records divide-y divide-border">
        {rows.map((row) => (
          <Link
            key={row.id}
            href={row.href}
            aria-label={`View report: ${row.title}`}
            className="block px-4 py-4 no-underline hover:bg-surface-hover/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-primary"
          >
            {showIncidentNumber ? (
              <p className="text-xs text-text-muted">{row.incident_number}</p>
            ) : null}
            <p className={`font-medium text-foreground ${showIncidentNumber ? "mt-1" : ""}`}>{row.title}</p>
            <p className="mt-1 text-sm text-text-secondary">
              {row.location ? formatLocationLabel(row.location) : "Not specified"}
            </p>
            {showReporter && row.reporter ? (
              <p className="mt-1 text-sm text-text-secondary">Reported by {row.reporter}</p>
            ) : null}
            {showCategory && row.category ? (
              <p className="mt-1 text-sm text-text-muted">{row.category}</p>
            ) : null}
            {showAssigned ? (
              <p className="mt-1 text-sm text-text-secondary">
                {row.assignedTo ? `Assigned to ${row.assignedTo}` : "Not assigned"}
              </p>
            ) : null}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <IncidentStatusBadge status={row.status} />
              {showPriority ? (
                <CasePriorityDisplay
                  officialPriority={row.priority}
                  reporterPriority={row.reporterPriority}
                  urgencySource={urgencySource}
                />
              ) : null}
              <span className="text-xs text-text-muted">
                {dateLabel}: {formatDate(row.date)}
              </span>
            </div>
          </Link>
        ))}
      </div>

      <div className="incident-table-grid">
          <table className={`w-full text-left text-sm ${showAssigned ? "min-w-[760px]" : showIncidentNumber ? "min-w-[640px]" : "min-w-[520px]"}`}>
          <thead className="border-b border-border text-text-muted">
            <tr>
              {showIncidentNumber ? (
                <th scope="col" className="px-4 py-3 font-medium">Incident ID</th>
              ) : null}
              <th scope="col" className="px-4 py-3 font-medium">Title</th>
              {showReporter ? <th scope="col" className="px-4 py-3 font-medium">Reporter</th> : null}
              {showCategory ? <th scope="col" className="px-4 py-3 font-medium">Category</th> : null}
              {showAssigned ? <th scope="col" className="px-4 py-3 font-medium">Assigned to</th> : null}
              <th scope="col" className="px-4 py-3 font-medium">Location</th>
              <th scope="col" className="px-4 py-3 font-medium">Status</th>
              {showPriority ? (
                <th scope="col" className="px-4 py-3 font-medium">
                  {priorityLabel}
                </th>
              ) : null}
              <th scope="col" className="px-4 py-3 font-medium">{dateLabel}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.id}
                className="border-b border-border last:border-b-0 hover:bg-surface-hover/60"
              >
                {showIncidentNumber ? (
                  <td className="px-4 py-4 text-text-muted">{row.incident_number}</td>
                ) : null}
                <td className="px-4 py-4">
                  <Link href={row.href} className="inline-flex min-h-11 items-center font-medium text-foreground hover:text-primary">
                    {row.title}
                  </Link>
                </td>
                {showReporter ? (
                  <td className="px-4 py-4 text-text-secondary">{row.reporter || "Not listed"}</td>
                ) : null}
                {showCategory ? (
                  <td className="px-4 py-4 text-text-secondary">{row.category || "Not listed"}</td>
                ) : null}
                {showAssigned ? (
                  <td className="px-4 py-4 text-text-secondary">
                    {row.assignedTo || "Not assigned"}
                  </td>
                ) : null}
                <td className="px-4 py-4 text-text-secondary">
                  {row.location ? formatLocationLabel(row.location) : "Not specified"}
                </td>
                <td className="px-4 py-4">
                  <IncidentStatusBadge status={row.status} />
                </td>
                {showPriority ? (
                  <td className="px-4 py-4">
                    <CasePriorityDisplay
                      officialPriority={row.priority}
                      reporterPriority={row.reporterPriority}
                      urgencySource={urgencySource}
                    />
                  </td>
                ) : null}
                <td className="px-4 py-4 text-text-muted">{formatDate(row.date)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
