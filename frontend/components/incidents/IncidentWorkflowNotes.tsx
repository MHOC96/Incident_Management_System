import { IncidentSection } from "@/components/incidents/IncidentSection";
import type { IncidentDetail } from "@/types";

type WorkflowNotes = Pick<
  IncidentDetail,
  "progress_note" | "resolution_statement" | "closure_note" | "reopen_reason"
>;

export function IncidentWorkflowNotes({ incident }: { incident: WorkflowNotes }) {
  const notes = [
    { label: "Latest progress update", value: incident.progress_note },
    { label: "Resolution statement", value: incident.resolution_statement },
    { label: "Closure note", value: incident.closure_note },
    { label: "Reason returned for more work", value: incident.reopen_reason },
  ].filter((item) => item.value);

  if (notes.length === 0) return null;

  return (
    <IncidentSection title="Operational updates" compact>
      <div className="divide-y divide-border">
        {notes.map((note) => (
          <div key={note.label} className="py-3 first:pt-0 last:pb-0">
            <h3 className="text-sm font-semibold text-foreground">{note.label}</h3>
            <p className="mt-1 whitespace-pre-wrap text-sm text-text-secondary">{note.value}</p>
          </div>
        ))}
      </div>
    </IncidentSection>
  );
}
