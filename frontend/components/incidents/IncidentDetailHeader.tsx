import Link from "next/link";
import type { ReactNode } from "react";
import { IncidentPriorityBadge } from "@/components/incidents/IncidentPriorityBadge";
import { IncidentStatusBadge } from "@/components/incidents/IncidentStatusBadge";
import { formatLocationPlace } from "@/lib/format";
import type { Category, IncidentPriority, IncidentStatus, Location } from "@/types";

type IncidentDetailHeaderProps = {
  backHref: string;
  backLabel: string;
  incidentNumber: string;
  title: string;
  status: IncidentStatus;
  priority?: IncidentPriority | null;
  location: Location;
  category: Category;
  summary?: string;
  showPriority?: boolean;
  showBorderBottom?: boolean;
  showIncidentNumber?: boolean;
  voteCount?: number;
  titleActions?: ReactNode;
  /** When set, replaces the default location/category block (compact student layout). */
  metaLine?: ReactNode;
};

export function IncidentDetailHeader({
  backHref,
  backLabel,
  incidentNumber,
  title,
  status,
  priority,
  location,
  category,
  summary,
  showPriority = true,
  showBorderBottom = true,
  showIncidentNumber = true,
  voteCount,
  titleActions,
  metaLine,
}: IncidentDetailHeaderProps) {
  return (
    <header
      className={`pb-4 md:pb-5 ${showBorderBottom ? "border-b border-border" : ""}`}
    >
      <Link
        href={backHref}
        className="inline-flex min-h-11 items-center text-sm font-medium text-primary hover:text-primary-dark"
      >
        {backLabel}
      </Link>

      {showIncidentNumber || (showPriority && priority) ? (
        <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2">
          {showIncidentNumber ? (
            <p className="text-sm text-text-muted">{incidentNumber}</p>
          ) : null}
          {showPriority && priority ? (
            <IncidentPriorityBadge priority={priority} />
          ) : null}
        </div>
      ) : null}

      <div className={`${showIncidentNumber || (showPriority && priority) ? "mt-2" : "mt-4"} flex items-start gap-3`}>
        <h1 className="public-incident-title min-w-0 flex-1 break-words text-[24px] font-semibold leading-tight md:text-[30px]">
          {title}
          {voteCount !== undefined ? (
            <span className="ml-2 whitespace-nowrap text-[18px] font-semibold text-text-secondary md:text-[22px]">
              · {voteCount} {voteCount === 1 ? "vote" : "votes"}
            </span>
          ) : null}
          <IncidentStatusBadge status={status} />
        </h1>
        {titleActions ? <div className="shrink-0">{titleActions}</div> : null}
      </div>

      {metaLine ? (
        <p className="mt-2 text-sm text-text-secondary">{metaLine}</p>
      ) : (
        <p className="mt-3 flex flex-wrap items-baseline gap-x-4 gap-y-1 text-sm">
          <span>
            <span className="text-text-muted">Location </span>
            <span className="font-medium text-foreground">{formatLocationPlace(location)}</span>
          </span>
          <span>
            <span className="text-text-muted">Category </span>
            <span className="font-medium text-foreground">{category.name}</span>
          </span>
        </p>
      )}

      {summary ? (
        <p className="mt-4 max-w-3xl rounded-md border border-border bg-background px-4 py-3 text-sm text-text-secondary">
          {summary}
        </p>
      ) : null}
    </header>
  );
}
