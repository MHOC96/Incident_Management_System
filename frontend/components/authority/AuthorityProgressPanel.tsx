"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { Textarea } from "@/components/ui/Textarea";
import { Toast, useToast } from "@/components/ui/Toast";
import { formatApiError } from "@/lib/errors";
import { getStatusLabel } from "@/lib/format";
import { officialIncidentService } from "@/services/authorityIncidents";
import type { OfficialIncident } from "@/types";

type AuthorityProgressPanelProps = {
  incident: OfficialIncident;
  onUpdated: (incident: OfficialIncident) => void;
};

export function AuthorityProgressPanel({
  incident,
  onUpdated,
}: AuthorityProgressPanelProps) {
  const [resolutionNote, setResolutionNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState<null | "start" | "resolve">(null);
  const { message, showToast, dismissToast } = useToast();

  const canStart = incident.status === "ASSIGNED";
  const canResolve =
    incident.status === "ASSIGNED" || incident.status === "IN_PROGRESS";
  const isComplete =
    incident.status === "RESOLVED" || incident.status === "CLOSED";

  async function handleStartProgress() {
    if (isSubmitting) return;
    setIsSubmitting("start");
    try {
      const updated = await officialIncidentService.startProgress(incident.id, "");
      onUpdated(updated);
      showToast("Work started.");
    } catch (startError) {
      showToast(formatApiError(startError, "We couldn't start progress."));
    } finally {
      setIsSubmitting(null);
    }
  }

  async function handleResolve() {
    if (isSubmitting) return;
    const note = resolutionNote.trim();
    if (!note) {
      showToast("Enter a resolution note before marking this case as solved.");
      return;
    }
    setIsSubmitting("resolve");
    try {
      const updated = await officialIncidentService.resolve(incident.id, note);
      onUpdated(updated);
      setResolutionNote("");
      showToast("Case marked as solved.");
    } catch (resolveError) {
      showToast(formatApiError(resolveError, "We couldn't mark this as solved."));
    } finally {
      setIsSubmitting(null);
    }
  }

  if (isComplete) {
    return (
      <>
        <h2 className="text-base font-semibold">Case outcome</h2>
        {incident.resolution_statement ? (
          <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-text-secondary">
            {incident.resolution_statement}
          </p>
        ) : (
          <p className="mt-3 text-sm text-text-secondary">
            Status: {getStatusLabel(incident.status)}.
          </p>
        )}
        {message ? <Toast message={message} onDismiss={dismissToast} /> : null}
      </>
    );
  }

  return (
    <>
      <h2 className="text-base font-semibold">Update case</h2>

      {canStart ? (
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-text-secondary">
            Confirm when you begin working on this assignment.
          </p>
          <Button
            type="button"
            variant="secondary"
            className="w-full shrink-0 sm:w-auto"
            isLoading={isSubmitting === "start"}
            loadingText="Starting..."
            disabled={isSubmitting !== null && isSubmitting !== "start"}
            onClick={() => void handleStartProgress()}
          >
            Start work
          </Button>
        </div>
      ) : null}

      {canResolve ? (
        <div className={canStart ? "mt-5" : "mt-4"}>
          <FormField
            label="Resolution note"
            htmlFor="resolution-note"
            required
            hint="Briefly describe what was done. The administrator and reporter will see this."
          >
            <Textarea
              id="resolution-note"
              value={resolutionNote}
              onChange={(event) => setResolutionNote(event.target.value)}
              rows={4}
              placeholder="What action was taken to address this case?"
            />
          </FormField>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              className="w-full sm:w-auto"
              disabled={isSubmitting !== null && isSubmitting !== "resolve"}
              isLoading={isSubmitting === "resolve"}
              loadingText="Saving..."
              onClick={() => void handleResolve()}
            >
              Mark as solved
            </Button>
          </div>
        </div>
      ) : null}

      {message ? <Toast message={message} onDismiss={dismissToast} /> : null}
    </>
  );
}
