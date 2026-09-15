"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Toast, useToast } from "@/components/ui/Toast";
import { formatApiError } from "@/lib/errors";
import { officialIncidentService } from "@/services/officialIncidents";
import type { OfficialIncident } from "@/types";

type OfficialProgressPanelProps = {
  incident: OfficialIncident;
  onUpdated: (incident: OfficialIncident) => void;
};

export function OfficialProgressPanel({
  incident,
  onUpdated,
}: OfficialProgressPanelProps) {
  const [isSubmitting, setIsSubmitting] = useState<null | "start" | "resolve">(null);
  const { message, showToast, dismissToast } = useToast();

  const canStart = incident.status === "ASSIGNED";
  const canResolve =
    incident.status === "ASSIGNED" || incident.status === "IN_PROGRESS";
  const isComplete =
    incident.status === "RESOLVED" || incident.status === "CLOSED";

  async function handleStartProgress() {
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
    setIsSubmitting("resolve");
    try {
      const updated = await officialIncidentService.resolve(incident.id, "");
      onUpdated(updated);
      showToast("Incident marked as resolved.");
    } catch (resolveError) {
      showToast(formatApiError(resolveError, "We couldn't mark this as resolved."));
    } finally {
      setIsSubmitting(null);
    }
  }

  if (isComplete) {
    return null;
  }

  return (
    <>
      <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
        {canStart ? (
          <Button
            type="button"
            className="px-4"
            isLoading={isSubmitting === "start"}
            loadingText="Starting..."
            onClick={() => void handleStartProgress()}
          >
            Start work
          </Button>
        ) : null}
        {canResolve ? (
          <Button
            type="button"
            variant={canStart ? "secondary" : "primary"}
            className="px-4"
            isLoading={isSubmitting === "resolve"}
            loadingText="Saving..."
            onClick={() => void handleResolve()}
          >
            Mark resolved
          </Button>
        ) : null}
      </div>

      {message ? <Toast message={message} onDismiss={dismissToast} /> : null}
    </>
  );
}
