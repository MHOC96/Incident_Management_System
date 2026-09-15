"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { Textarea } from "@/components/ui/Textarea";
import { formatApiError } from "@/lib/errors";
import { getStatusLabel } from "@/lib/format";
import { placeholders } from "@/lib/placeholders";
import { adminIncidentService } from "@/services/adminIncidents";
import type { AdminIncidentReview } from "@/types";

type Props = {
  incident: AdminIncidentReview;
  onUpdated: (incident: AdminIncidentReview) => void;
};

export function AdminReviewActions({ incident, onUpdated }: Props) {
  const rejectDialogRef = useRef<HTMLDialogElement>(null);
  const [comment, setComment] = useState("");
  const [rejectKind, setRejectKind] = useState<"incident" | "changes" | null>(null);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function run(action: () => Promise<AdminIncidentReview>) {
    setError("");
    setIsSubmitting(true);
    try {
      onUpdated(await action());
      setComment("");
      setRejectKind(null);
      rejectDialogRef.current?.close();
    } catch (actionError) {
      setError(formatApiError(actionError, "We couldn't complete this review action."));
    } finally {
      setIsSubmitting(false);
    }
  }

  function openReject(kind: "incident" | "changes") {
    setError("");
    setComment("");
    setRejectKind(kind);
    rejectDialogRef.current?.showModal();
  }

  if (incident.pending_revision) {
    return (
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        <Button
          type="button"
          className="px-4"
          isLoading={isSubmitting}
          loadingText="Approving..."
          onClick={() => void run(() => adminIncidentService.approveChanges(incident.id))}
        >
          Approve changes
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="px-3 text-danger hover:text-danger"
          onClick={() => openReject("changes")}
        >
          Reject changes
        </Button>
        <RejectDialog
          dialogRef={rejectDialogRef}
          rejectKind={rejectKind}
          comment={comment}
          setComment={setComment}
          error={error}
          isSubmitting={isSubmitting}
          onCancel={() => rejectDialogRef.current?.close()}
          onConfirm={() => {
            if (rejectKind === "changes") {
              void run(() => adminIncidentService.rejectChanges(incident.id, comment));
            } else if (rejectKind === "incident") {
              void run(() => adminIncidentService.reject(incident.id, comment));
            }
          }}
        />
      </div>
    );
  }

  const canReview = incident.status === "SUBMITTED" || incident.status === "UNDER_REVIEW";
  if (!canReview) {
    return (
      <p className="shrink-0 text-sm text-text-secondary">
        Status:{" "}
        <span className="font-medium text-foreground">{getStatusLabel(incident.status)}</span>
      </p>
    );
  }

  return (
    <div className="flex shrink-0 flex-wrap items-center gap-2">
      <Button
        type="button"
        className="px-4"
        isLoading={isSubmitting}
        loadingText="Verifying..."
        onClick={() => void run(() => adminIncidentService.verify(incident.id))}
      >
        Verify and forward
      </Button>
      <Button
        type="button"
        variant="ghost"
        className="px-3 text-danger hover:text-danger"
        onClick={() => openReject("incident")}
      >
        Reject
      </Button>
      <RejectDialog
        dialogRef={rejectDialogRef}
        rejectKind={rejectKind}
        comment={comment}
        setComment={setComment}
        error={error}
        isSubmitting={isSubmitting}
        onCancel={() => rejectDialogRef.current?.close()}
        onConfirm={() => {
          if (rejectKind === "incident") {
            void run(() => adminIncidentService.reject(incident.id, comment));
          }
        }}
      />
    </div>
  );
}

type RejectDialogProps = {
  dialogRef: React.RefObject<HTMLDialogElement | null>;
  rejectKind: "incident" | "changes" | null;
  comment: string;
  setComment: (value: string) => void;
  error: string;
  isSubmitting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

function RejectDialog({
  dialogRef,
  rejectKind,
  comment,
  setComment,
  error,
  isSubmitting,
  onCancel,
  onConfirm,
}: RejectDialogProps) {
  const isChanges = rejectKind === "changes";

  return (
    <dialog
      ref={dialogRef}
      aria-label={isChanges ? "Reject submitted changes" : "Reject incident report"}
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded-md border border-border bg-surface p-0 backdrop:bg-black/60"
      onClick={(event) => {
        if (event.target === event.currentTarget) dialogRef.current?.close();
      }}
    >
      <div className="p-4 md:p-5">
        <h2 className="text-base font-semibold">
          {isChanges ? "Reject submitted changes" : "Reject this report"}
        </h2>
        <p className="mt-1 text-sm text-text-secondary">
          {isChanges
            ? "The student will keep the current approved details. Explain what should be corrected."
            : "Provide a clear reason the student can use to update and resubmit."}
        </p>
        <div className="mt-4">
        <FormField
          label={isChanges ? "Reason for not approving" : "Rejection reason"}
          htmlFor="admin-reject-comment"
          required
        >
          <Textarea
            id="admin-reject-comment"
            value={comment}
            rows={4}
            required
            placeholder={isChanges ? undefined : placeholders.rejectionReason}
            onChange={(event) => setComment(event.target.value)}
          />
        </FormField>
        </div>
        {error ? (
          <p className="mt-3 text-sm text-danger" role="alert">
            {error}
          </p>
        ) : null}
        <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="ghost" disabled={isSubmitting} onClick={onCancel}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="danger"
            disabled={!comment.trim()}
            isLoading={isSubmitting}
            loadingText="Submitting..."
            onClick={onConfirm}
          >
            Confirm rejection
          </Button>
        </div>
      </div>
    </dialog>
  );
}
