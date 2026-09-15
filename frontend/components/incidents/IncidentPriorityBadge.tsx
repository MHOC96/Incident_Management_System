import type { IncidentPriority } from "@/types";
import { getPriorityClassName, getPriorityLabel } from "@/lib/format";

type IncidentPriorityBadgeProps = {
  priority: IncidentPriority | null;
};

export function IncidentPriorityBadge({ priority }: IncidentPriorityBadgeProps) {
  if (!priority) {
    return <span className="text-sm text-text-muted">Not set</span>;
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-sm border px-2 py-0.5 text-xs font-medium ${getPriorityClassName(priority)}`}
    >
      <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-current" />
      {getPriorityLabel(priority)}
    </span>
  );
}
