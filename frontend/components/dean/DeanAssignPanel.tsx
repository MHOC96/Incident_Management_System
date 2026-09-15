"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { Select } from "@/components/ui/Select";
import { Toast, useToast } from "@/components/ui/Toast";
import { formatOfficialAssignOption, getPriorityLabel } from "@/lib/format";
import { formatApiError } from "@/lib/errors";
import { deanIncidentService } from "@/services/deanIncidents";
import { officialService } from "@/services/officials";
import type { DeanIncident, IncidentPriority, OfficialAccount } from "@/types";

type DeanAssignPanelProps = {
  incident: DeanIncident;
  onUpdated: (incident: DeanIncident) => void;
};

const priorityOptions: IncidentPriority[] = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

export function DeanAssignPanel({ incident, onUpdated }: DeanAssignPanelProps) {
  const assignRef = useRef<HTMLDialogElement>(null);

  const [officials, setOfficials] = useState<OfficialAccount[]>([]);
  const [optionsLoaded, setOptionsLoaded] = useState(false);
  const [assignedOfficial, setAssignedOfficial] = useState("");
  const [priority, setPriority] = useState(incident.priority ?? "MEDIUM");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState<null | "assign" | "close">(null);
  const { message, showToast, dismissToast } = useToast();

  async function ensureAssignmentOptions() {
    if (optionsLoaded) {
      return;
    }
    const officialData = await officialService.listActive();
    setOfficials(officialData);
    setOptionsLoaded(true);
  }

  function openAssignDialog() {
    setError("");
    setPriority(incident.priority ?? "MEDIUM");
    void ensureAssignmentOptions().catch(() => {
      setError("We couldn't load assignment options.");
    });
    assignRef.current?.showModal();
  }

  const canAssign = incident.status === "FORWARDED_TO_DEAN";

  const canClose = incident.status === "RESOLVED";

  async function handleAssign() {
    setError("");
    setIsSubmitting("assign");
    try {
      if (!assignedOfficial) {
        setError("Select an official before assigning this incident.");
        return;
      }
      const updated = await deanIncidentService.assign(incident.id, {
        assigned_official: Number(assignedOfficial),
        priority,
      });
      onUpdated(updated);
      assignRef.current?.close();
      showToast("Incident assigned successfully.");
    } catch (assignError) {
      setError(formatApiError(assignError, "We couldn't assign this incident."));
    } finally {
      setIsSubmitting(null);
    }
  }

  async function handleClose() {
    setIsSubmitting("close");
    try {
      const updated = await deanIncidentService.close(incident.id);
      onUpdated(updated);
      showToast("Incident closed.");
    } catch (closeError) {
      showToast(formatApiError(closeError, "We couldn't close this incident."));
    } finally {
      setIsSubmitting(null);
    }
  }

  return (
    <>
      <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
        {canAssign ? (
          <Button type="button" className="px-4" onClick={openAssignDialog}>
            Assign official
          </Button>
        ) : null}
        {canClose ? (
          <Button
            type="button"
            className="px-4"
            isLoading={isSubmitting === "close"}
            loadingText="Closing..."
            onClick={() => void handleClose()}
          >
            Close incident
          </Button>
        ) : null}
      </div>

      <dialog
        ref={assignRef}
        aria-label="Assign incident"
        className="workspace-dialog workspace-dialog-wide"
        onClick={(event) => {
          if (event.target === event.currentTarget) assignRef.current?.close();
        }}
      >
        <div className="workspace-dialog-panel">
          <div className="workspace-dialog-body">
          <h2 className="text-lg font-semibold">Assign incident</h2>
          <p className="mt-1 text-sm text-text-secondary">
            Select the official who will handle this incident and set official priority.
          </p>
          <div className="mt-4 space-y-4">
            <FormField label="Assigned official" htmlFor="dean-official" required>
              <Select
                id="dean-official"
                value={assignedOfficial}
                onChange={(event) => setAssignedOfficial(event.target.value)}
                required
                searchable
                searchPlaceholder="Search by name or position..."
              >
                <option value="">Select official</option>
                {officials.map((official) => (
                  <option key={official.id} value={official.id}>
                    {formatOfficialAssignOption(official)}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label="Official priority" htmlFor="dean-assign-priority" required>
              <Select
                id="dean-assign-priority"
                value={priority}
                onChange={(event) => setPriority(event.target.value as IncidentPriority)}
                required
              >
                {priorityOptions.map((option) => (
                  <option key={option} value={option}>
                    {getPriorityLabel(option)}
                  </option>
                ))}
              </Select>
            </FormField>
          </div>
          {error ? (
            <p className="mt-3 text-sm text-danger" role="alert">
              {error}
            </p>
          ) : null}
          </div>
          <div className="workspace-dialog-footer">
            <Button type="button" variant="ghost" onClick={() => assignRef.current?.close()}>
              Cancel
            </Button>
            <Button
              type="button"
              disabled={!assignedOfficial}
              isLoading={isSubmitting === "assign"}
              loadingText="Assigning..."
              onClick={() => void handleAssign()}
            >
              Confirm assignment
            </Button>
          </div>
        </div>
      </dialog>

      {message ? <Toast message={message} onDismiss={dismissToast} /> : null}
    </>
  );
}
