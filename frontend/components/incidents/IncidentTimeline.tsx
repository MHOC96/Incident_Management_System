import { formatDateTimeColombo } from "@/lib/format";
import type { Assignment, IncidentStatus, PublicIncident } from "@/types";

export type TimelineEvent = {
  id: string;
  label: string;
  at: string;
  detail?: string;
};

type IncidentTimelineProps = {
  incident: PublicIncident & { current_assignment?: Assignment | null };
  compact?: boolean;
};

const activeStatuses: IncidentStatus[] = [
  "ASSIGNED",
  "IN_PROGRESS",
  "RESOLVED",
  "CLOSED",
];

export function buildTimelineEvents(
  incident: PublicIncident & { current_assignment?: Assignment | null },
): TimelineEvent[] {
  const events: TimelineEvent[] = [
    {
      id: "submitted",
      label: "Incident submitted",
      at: incident.created_at,
    },
  ];

  if (incident.status === "REJECTED") {
    events.push({
      id: "rejected",
      label: "Incident rejected",
      at: incident.updated_at,
    });
  } else {
    if (incident.verified_at) {
      events.push({
        id: "verified",
        label: "Incident verified",
        at: incident.verified_at,
      });
    }

    if (
      incident.current_assignment &&
      activeStatuses.includes(incident.status)
    ) {
      events.push({
        id: "assigned",
        label: "Assigned for resolution",
        at: incident.current_assignment.assigned_at,
        detail: incident.current_assignment.assigned_official_name,
      });
    }

    if (incident.status === "IN_PROGRESS") {
      events.push({
        id: "in-progress",
        label: "Work in progress",
        at: incident.updated_at,
      });
    }

    if (incident.resolved_at) {
      events.push({
        id: "resolved",
        label: "Resolution reported",
        at: incident.resolved_at,
      });
    }

    if (incident.closed_at) {
      events.push({
        id: "closed",
        label: "Incident closed",
        at: incident.closed_at,
      });
    }
  }

  return events.sort(
    (left, right) => new Date(left.at).getTime() - new Date(right.at).getTime(),
  );
}

export function IncidentTimeline({ incident, compact = false }: IncidentTimelineProps) {
  const events = buildTimelineEvents(incident);

  return (
    <div
      id="incident-timeline"
      tabIndex={-1}
      className={`incident-timeline ${compact ? "student-incident-timeline" : "rounded-lg border border-border bg-surface p-4 md:p-6"}`}
    >
      <h2 className={`font-semibold ${compact ? "mb-3 text-base" : "mb-4 text-[18px]"}`}>
        Progress
      </h2>
      {events.length === 0 ? (
        <p className="text-sm text-text-secondary">No progress recorded yet.</p>
      ) : (
        <ol className="space-y-0">
          {events.map((event, index) => (
            <li key={event.id} className="flex gap-3">
              <div className="flex flex-col items-center">
                <span
                  className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${
                    index === events.length - 1 ? "bg-primary" : "bg-border"
                  }`}
                />
                {index < events.length - 1 ? (
                  <span className="mt-1 w-px flex-1 min-h-6 bg-border" />
                ) : null}
              </div>
              <div className={`min-w-0 ${index < events.length - 1 ? "pb-4" : ""}`}>
                <p className="text-sm font-medium">{event.label}</p>
                {event.detail ? (
                  <p className="break-words text-sm text-text-secondary">{event.detail}</p>
                ) : null}
                <p className="text-xs text-text-muted">{formatDateTimeColombo(event.at)}</p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
