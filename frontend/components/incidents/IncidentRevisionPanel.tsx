import { formatDate } from "@/lib/format";
import type { IncidentRevision } from "@/types";

type IncidentRevisionPanelProps = {
  revision: IncidentRevision;
  title?: string;
};

export function IncidentRevisionPanel({
  revision,
  title = "Submitted changes",
}: IncidentRevisionPanelProps) {
  return (
    <section className="rounded-lg border border-border bg-surface p-4 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-[18px] font-semibold">{title}</h2>
          <p className="mt-1 text-sm text-text-secondary">
            Submitted {formatDate(revision.submitted_at)}
          </p>
        </div>
        <span className="rounded-sm border border-border px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-text-secondary">
          {revision.status === "PENDING"
            ? "Awaiting review"
            : revision.status === "APPROVED"
              ? "Approved"
              : "Not approved"}
        </span>
      </div>

      <div className="mt-5 divide-y divide-border border-y border-border">
        {revision.changes.map((change) => (
          <div key={change.field} className="grid gap-2 py-4 md:grid-cols-[9rem_1fr_1fr] md:gap-4">
            <p className="text-sm font-semibold text-foreground">{change.label}</p>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-text-muted">Current</p>
              <p className="mt-1 whitespace-pre-wrap break-words text-sm text-text-secondary">
                {change.before}
              </p>
            </div>
            <div className="border-l-2 border-primary/40 pl-3">
              <p className="text-xs font-medium uppercase tracking-wide text-primary">Proposed</p>
              <p className="mt-1 whitespace-pre-wrap break-words text-sm text-foreground">
                {change.after}
              </p>
            </div>
          </div>
        ))}
      </div>

      {revision.review_comment ? (
        <div className="mt-4 rounded-md border border-border bg-background px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-wide text-text-muted">Review reason</p>
          <p className="mt-1 whitespace-pre-wrap text-sm text-text-secondary">
            {revision.review_comment}
          </p>
        </div>
      ) : null}
    </section>
  );
}
