import { IncidentPriorityBadge } from "@/components/incidents/IncidentPriorityBadge";
import {
  getReporterPriorityClassName,
  getReporterPriorityLabel,
} from "@/lib/format";
import type { IncidentPriority, ReporterPriority } from "@/types";

type CasePriorityDisplayProps = {
  officialPriority: IncidentPriority | null | undefined;
  reporterPriority?: ReporterPriority | null;
  /** ADMIN: reporter urgency. All other staff views: administrator-assigned priority. */
  urgencySource?: "reporter" | "official";
  /** @deprecated Use urgencySource="official" */
  officialOnly?: boolean;
};

export function CasePriorityDisplay({
  officialPriority,
  reporterPriority,
  urgencySource,
  officialOnly = false,
}: CasePriorityDisplayProps) {
  const source = urgencySource ?? (officialOnly ? "official" : "official");

  if (source === "reporter") {
    if (reporterPriority) {
      return (
        <span
          className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-sm border px-2 py-0.5 text-xs font-medium ${getReporterPriorityClassName(reporterPriority)}`}
        >
          <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-current" />
          {getReporterPriorityLabel(reporterPriority)}
        </span>
      );
    }
    return <span className="text-sm text-text-muted">Not set</span>;
  }

  if (officialPriority) {
    return <IncidentPriorityBadge priority={officialPriority} />;
  }

  return <span className="text-sm text-text-muted">Not set by administrator</span>;
}
