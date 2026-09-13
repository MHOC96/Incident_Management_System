"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { Textarea } from "@/components/ui/Textarea";
import { formatApiError } from "@/lib/errors";
import { getStatusLabel } from "@/lib/format";
import { placeholders } from "@/lib/placeholders";
import { adminIncidentService } from "@/services/adminIncidents";
import type { AdminIncidentReview } from "@/types";

type Props = { incident: AdminIncidentReview; onUpdated: (incident: AdminIncidentReview) => void };

export function AdminReviewActions({ incident, onUpdated }: Props) {
  const [comment, setComment] = useState("");
  const [mode, setMode] = useState<"reject-incident" | "reject-changes" | null>(null);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function run(action: () => Promise<AdminIncidentReview>) {
    setError("");
    setIsSubmitting(true);
    try {
      onUpdated(await action());
      setComment("");
      setMode(null);
    } catch (actionError) {
      setError(formatApiError(actionError, "We couldn't complete this review action."));
    } finally {
      setIsSubmitting(false);
    }
  }

  if (incident.pending_revision) {
    return (
      <div className="rounded-lg border border-border bg-surface p-4 md:p-5">
        <h2 className="text-[18px] font-semibold">Review submitted changes</h2>
        <p className="mt-2 text-sm text-text-secondary">Compare the current and proposed values before deciding. Approval updates the live incident immediately.</p>
        {error ? <p className="mt-4 text-sm text-danger" role="alert">{error}</p> : null}
        {mode === "reject-changes" ? (
          <div className="mt-5 space-y-3">
            <FormField label="Reason for not approving" htmlFor="revision-reason" required>
              <Textarea id="revision-reason" value={comment} rows={4} required onChange={(event) => setComment(event.target.value)} />
            </FormField>
            <Button type="button" variant="danger" className="w-full" disabled={!comment.trim()} isLoading={isSubmitting} loadingText="Rejecting changes..." onClick={() => void run(() => adminIncidentService.rejectChanges(incident.id, comment))}>Confirm rejection</Button>
            <Button type="button" variant="ghost" className="w-full" onClick={() => setMode(null)}>Cancel</Button>
          </div>
        ) : (
          <div className="mt-5 space-y-2">
            <Button type="button" className="w-full" isLoading={isSubmitting} loadingText="Approving changes..." onClick={() => void run(() => adminIncidentService.approveChanges(incident.id))}>Approve changes</Button>
            <Button type="button" variant="secondary" className="w-full" onClick={() => setMode("reject-changes")}>Reject changes</Button>
          </div>
        )}
      </div>
    );
  }

  const canReview = incident.status === "SUBMITTED" || incident.status === "UNDER_REVIEW";
  if (!canReview) {
    return (
      <div className="rounded-lg border border-border bg-surface p-4 md:p-5">
        <h2 className="text-[18px] font-semibold">Current status</h2>
        <p className="mt-2 text-sm text-text-secondary">This incident is <span className="font-medium text-foreground">{getStatusLabel(incident.status)}</span>.</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-surface p-4 md:p-5">
      <h2 className="text-[18px] font-semibold">Review decision</h2>
      <p className="mt-2 text-sm text-text-secondary">Verify a complete and valid report, or reject it with a clear reason the student can act on.</p>
      {error ? <p className="mt-4 text-sm text-danger" role="alert">{error}</p> : null}
      {mode === "reject-incident" ? (
        <div className="mt-5 space-y-3">
          <FormField label="Rejection reason" htmlFor="reject-comment" required>
            <Textarea id="reject-comment" value={comment} rows={4} required placeholder={placeholders.rejectionReason} onChange={(event) => setComment(event.target.value)} />
          </FormField>
          <Button type="button" variant="danger" className="w-full" disabled={!comment.trim()} isLoading={isSubmitting} loadingText="Rejecting incident..." onClick={() => void run(() => adminIncidentService.reject(incident.id, comment))}>Confirm rejection</Button>
          <Button type="button" variant="ghost" className="w-full" onClick={() => setMode(null)}>Cancel</Button>
        </div>
      ) : (
        <div className="mt-5 space-y-2">
          <Button type="button" className="w-full" isLoading={isSubmitting} loadingText="Verifying incident..." onClick={() => void run(() => adminIncidentService.verify(incident.id))}>Verify and forward</Button>
          <Button type="button" variant="secondary" className="w-full" onClick={() => setMode("reject-incident")}>Reject incident</Button>
        </div>
      )}
    </div>
  );
}
