"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Toast, useToast } from "@/components/ui/Toast";
import { getPositionLabel, getPriorityLabel } from "@/lib/format";
import { formatApiError } from "@/lib/errors";
import { placeholders } from "@/lib/placeholders";
import { deanIncidentService, responsiblePartyService } from "@/services/deanIncidents";
import { officialService } from "@/services/officials";
import type {
  DeanIncident,
  IncidentPriority,
  OfficialAccount,
  ResponsibleParty,
} from "@/types";

type DeanAssignPanelProps = {
  incident: DeanIncident;
  onUpdated: (incident: DeanIncident) => void;
};

const priorityOptions: IncidentPriority[] = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

export function DeanAssignPanel({ incident, onUpdated }: DeanAssignPanelProps) {
  const assignRef = useRef<HTMLDialogElement>(null);
  const priorityRef = useRef<HTMLDialogElement>(null);
  const closeRef = useRef<HTMLDialogElement>(null);
  const reopenRef = useRef<HTMLDialogElement>(null);

  const [officials, setOfficials] = useState<OfficialAccount[]>([]);
  const [parties, setParties] = useState<ResponsibleParty[]>([]);
  const [optionsLoaded, setOptionsLoaded] = useState(false);
  const [assignedOfficial, setAssignedOfficial] = useState("");
  const [responsibleParty, setResponsibleParty] = useState("");
  const [priority, setPriority] = useState(incident.priority ?? "MEDIUM");
  const [comment, setComment] = useState("");
  const [closeComment, setCloseComment] = useState("");
  const [reopenComment, setReopenComment] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState<
    null | "priority" | "assign" | "close" | "reopen"
  >(null);
  const { message, showToast, dismissToast } = useToast();

  useEffect(() => {
    setPriority(incident.priority ?? "MEDIUM");
  }, [incident.priority]);

  async function ensureAssignmentOptions() {
    if (optionsLoaded) {
      return;
    }
    const [officialData, partyData] = await Promise.all([
      officialService.listActive(),
      responsiblePartyService.list(),
    ]);
    setOfficials(officialData);
    setParties(partyData);
    setOptionsLoaded(true);
  }

  function openAssignDialog() {
    setError("");
    void ensureAssignmentOptions().catch(() => {
      setError("We couldn't load assignment options.");
    });
    assignRef.current?.showModal();
  }

  function openPriorityDialog() {
    setError("");
    setPriority(incident.priority ?? "MEDIUM");
    priorityRef.current?.showModal();
  }

  const canAssign =
    incident.status === "FORWARDED_TO_DEAN" ||
    incident.status === "ASSIGNED" ||
    incident.status === "IN_PROGRESS";

  const canClose = incident.status === "RESOLVED";
  const canReopen = incident.status === "RESOLVED";
  const canSetPriority = incident.status !== "CLOSED" && incident.status !== "REJECTED";

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
        responsible_party: responsibleParty ? Number(responsibleParty) : null,
        comment,
        priority,
      });
      onUpdated(updated);
      assignRef.current?.close();
      setComment("");
      showToast("Incident assigned successfully.");
    } catch (assignError) {
      setError(formatApiError(assignError, "We couldn't assign this incident."));
    } finally {
      setIsSubmitting(null);
    }
  }

  async function handlePriorityUpdate() {
    setError("");
    setIsSubmitting("priority");
    try {
      const updated = await deanIncidentService.setPriority(incident.id, priority);
      onUpdated(updated);
      priorityRef.current?.close();
      showToast("Priority updated.");
    } catch (priorityError) {
      setError(formatApiError(priorityError, "We couldn't update priority."));
    } finally {
      setIsSubmitting(null);
    }
  }

  async function handleClose() {
    setError("");
    setIsSubmitting("close");
    try {
      const updated = await deanIncidentService.close(incident.id, closeComment);
      onUpdated(updated);
      closeRef.current?.close();
      setCloseComment("");
      showToast("Incident closed.");
    } catch (closeError) {
      setError(formatApiError(closeError, "We couldn't close this incident."));
    } finally {
      setIsSubmitting(null);
    }
  }

  async function handleReopen() {
    setError("");
    setIsSubmitting("reopen");
    try {
      const updated = await deanIncidentService.reopen(incident.id, reopenComment);
      onUpdated(updated);
      reopenRef.current?.close();
      setReopenComment("");
      showToast("Incident returned for additional work.");
    } catch (reopenError) {
      setError(formatApiError(reopenError, "We couldn't reopen this incident."));
    } finally {
      setIsSubmitting(null);
    }
  }

  return (
    <>
      <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
        {canSetPriority ? (
          <Button type="button" variant="ghost" className="px-3" onClick={openPriorityDialog}>
            Priority
          </Button>
        ) : null}
        {canAssign ? (
          <Button type="button" className="px-4" onClick={openAssignDialog}>
            Assign official
          </Button>
        ) : null}
        {canReopen ? (
          <Button
            type="button"
            variant="ghost"
            className="px-3"
            onClick={() => {
              setError("");
              reopenRef.current?.showModal();
            }}
          >
            Return for work
          </Button>
        ) : null}
        {canClose ? (
          <Button
            type="button"
            className="px-4"
            onClick={() => {
              setError("");
              closeRef.current?.showModal();
            }}
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
          <div className="mt-4 space-y-4">
            <FormField label="Assigned official" htmlFor="dean-official" required>
              <Select
                id="dean-official"
                value={assignedOfficial}
                onChange={(event) => setAssignedOfficial(event.target.value)}
                required
                searchable
                searchPlaceholder="Search officials..."
              >
                <option value="">Select official</option>
                {officials.map((official) => (
                  <option key={official.id} value={official.id}>
                    {official.name} ({getPositionLabel(official.position)})
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label="Responsible party" htmlFor="dean-party">
              <Select
                id="dean-party"
                value={responsibleParty}
                onChange={(event) => setResponsibleParty(event.target.value)}
                searchable
                searchPlaceholder="Search responsible parties..."
              >
                <option value="">Optional</option>
                {parties.map((party) => (
                  <option key={party.id} value={party.id}>
                    {party.name}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label="Official priority" htmlFor="dean-assign-priority">
              <Select
                id="dean-assign-priority"
                value={priority}
                onChange={(event) => setPriority(event.target.value as IncidentPriority)}
              >
                {priorityOptions.map((option) => (
                  <option key={option} value={option}>
                    {getPriorityLabel(option)}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label="Assignment comment" htmlFor="dean-comment">
              <Textarea
                id="dean-comment"
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                rows={3}
                placeholder={placeholders.assignmentComment}
              />
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

      <dialog
        ref={priorityRef}
        aria-label="Update priority"
        className="workspace-dialog"
        onClick={(event) => {
          if (event.target === event.currentTarget) priorityRef.current?.close();
        }}
      >
        <div className="workspace-dialog-panel">
          <div className="workspace-dialog-body">
            <h2 className="text-lg font-semibold">Update priority</h2>
            <p className="mt-1 text-sm text-text-secondary">
              Choose the official priority for this incident.
            </p>
            <fieldset className="mt-3 border-0 p-0">
              <legend className="text-sm font-medium text-foreground">Official priority</legend>
              <div className="workspace-priority-options">
                {priorityOptions.map((option) => (
                  <label key={option} className="workspace-priority-option">
                    <input
                      type="radio"
                      name="dean-priority"
                      value={option}
                      checked={priority === option}
                      onChange={() => setPriority(option)}
                    />
                    <span className="font-medium">{getPriorityLabel(option)}</span>
                  </label>
                ))}
              </div>
            </fieldset>
            {error ? (
              <p className="mt-3 text-sm text-danger" role="alert">
                {error}
              </p>
            ) : null}
          </div>
          <div className="workspace-dialog-footer">
            <Button type="button" variant="ghost" className="w-full sm:w-auto" onClick={() => priorityRef.current?.close()}>
              Cancel
            </Button>
            <Button
              type="button"
              className="w-full sm:w-auto"
              isLoading={isSubmitting === "priority"}
              loadingText="Updating..."
              onClick={() => void handlePriorityUpdate()}
            >
              Save priority
            </Button>
          </div>
        </div>
      </dialog>

      <dialog
        ref={closeRef}
        aria-label="Close incident"
        className="workspace-dialog"
        onClick={(event) => {
          if (event.target === event.currentTarget) closeRef.current?.close();
        }}
      >
        <div className="workspace-dialog-panel">
          <div className="workspace-dialog-body">
          <h2 className="text-lg font-semibold">Close incident</h2>
          <p className="mt-1 text-sm text-text-secondary">
            Review the official resolution before closing this incident.
          </p>
          <div className="mt-4">
            <FormField label="Closure note (optional)" htmlFor="dean-close-comment">
              <Textarea
                id="dean-close-comment"
                value={closeComment}
                onChange={(event) => setCloseComment(event.target.value)}
                rows={3}
                placeholder={placeholders.closureNote}
              />
            </FormField>
          </div>
          {error ? (
            <p className="mt-3 text-sm text-danger" role="alert">
              {error}
            </p>
          ) : null}
          </div>
          <div className="workspace-dialog-footer">
            <Button type="button" variant="ghost" className="w-full sm:w-auto" onClick={() => closeRef.current?.close()}>
              Cancel
            </Button>
            <Button
              type="button"
              className="w-full sm:w-auto"
              isLoading={isSubmitting === "close"}
              loadingText="Closing..."
              onClick={() => void handleClose()}
            >
              Close incident
            </Button>
          </div>
        </div>
      </dialog>

      <dialog
        ref={reopenRef}
        aria-label="Return incident for additional work"
        className="workspace-dialog"
        onClick={(event) => {
          if (event.target === event.currentTarget) reopenRef.current?.close();
        }}
      >
        <div className="workspace-dialog-panel">
          <div className="workspace-dialog-body">
          <h2 className="text-lg font-semibold">Return for additional work</h2>
          <div className="mt-4">
            <FormField label="Reason (optional)" htmlFor="dean-reopen-comment">
              <Textarea
                id="dean-reopen-comment"
                value={reopenComment}
                onChange={(event) => setReopenComment(event.target.value)}
                rows={3}
                placeholder={placeholders.reopenReason}
              />
            </FormField>
          </div>
          {error ? (
            <p className="mt-3 text-sm text-danger" role="alert">
              {error}
            </p>
          ) : null}
          </div>
          <div className="workspace-dialog-footer">
            <Button type="button" variant="ghost" className="w-full sm:w-auto" onClick={() => reopenRef.current?.close()}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="w-full sm:w-auto"
              isLoading={isSubmitting === "reopen"}
              loadingText="Submitting..."
              onClick={() => void handleReopen()}
            >
              Return to in progress
            </Button>
          </div>
        </div>
      </dialog>

      {message ? <Toast message={message} onDismiss={dismissToast} /> : null}
    </>
  );
}
