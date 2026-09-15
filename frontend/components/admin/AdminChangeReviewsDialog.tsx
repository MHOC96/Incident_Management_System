"use client";

import { X } from "lucide-react";
import { useRef, useState } from "react";
import { IncidentRevisionPanel } from "@/components/incidents/IncidentRevisionPanel";
import { Button } from "@/components/ui/Button";
import { formatDateTimeColombo } from "@/lib/format";
import type { IncidentRevision } from "@/types";

type Props = {
  revisions: IncidentRevision[];
};

function completedRevisions(revisions: IncidentRevision[]): IncidentRevision[] {
  return revisions
    .filter((revision) => revision.status === "APPROVED" || revision.status === "REJECTED")
    .sort(
      (left, right) =>
        new Date(right.reviewed_at ?? right.submitted_at).getTime() -
        new Date(left.reviewed_at ?? left.submitted_at).getTime(),
    );
}

function revisionListDate(revision: IncidentRevision): string {
  return formatDateTimeColombo(revision.reviewed_at ?? revision.submitted_at);
}

function DialogCloseButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label="Close"
      className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-sm text-text-secondary hover:text-foreground"
      onClick={onClick}
    >
      <X size={20} aria-hidden="true" />
    </button>
  );
}

function RevisionListSection({
  title,
  items,
  onSelect,
}: {
  title: string;
  items: IncidentRevision[];
  onSelect: (revision: IncidentRevision) => void;
}) {
  if (items.length === 0) {
    return (
      <section>
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        <p className="mt-2 text-sm text-text-secondary">None recorded.</p>
      </section>
    );
  }

  return (
    <section>
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <ul className="mt-2 divide-y divide-border">
        {items.map((revision) => (
          <li key={revision.id}>
            <button
              type="button"
              className="flex w-full min-h-11 items-center justify-between gap-3 px-3 py-2.5 text-left text-sm hover:bg-surface-hover"
              onClick={() => onSelect(revision)}
            >
              <span className="font-medium text-foreground">
                {revision.changes.length}{" "}
                {revision.changes.length === 1 ? "field changed" : "fields changed"}
              </span>
              <span className="shrink-0 text-text-muted">{revisionListDate(revision)}</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function AdminChangeReviewsDialog({ revisions }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [selected, setSelected] = useState<IncidentRevision | null>(null);
  const completed = completedRevisions(revisions);
  const approved = completed.filter((revision) => revision.status === "APPROVED");
  const rejected = completed.filter((revision) => revision.status === "REJECTED");

  if (completed.length === 0) {
    return null;
  }

  function openDialog() {
    setSelected(null);
    dialogRef.current?.showModal();
  }

  function closeDialog() {
    dialogRef.current?.close();
    setSelected(null);
  }

  return (
    <>
      <Button type="button" variant="ghost" className="px-3" onClick={openDialog}>
        Change reviews ({completed.length})
      </Button>

      <dialog
        ref={dialogRef}
        aria-label="Past change reviews"
        className="m-auto w-[calc(100%-2rem)] max-w-2xl rounded-md border border-border bg-surface p-0 backdrop:bg-black/60"
        onClick={(event) => {
          if (event.target === event.currentTarget) closeDialog();
        }}
      >
        <div className="max-h-[86dvh] overflow-auto p-4 md:p-5">
          {selected ? (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <Button
                  type="button"
                  variant="ghost"
                  className="px-2"
                  onClick={() => setSelected(null)}
                >
                  ← All reviews
                </Button>
                <DialogCloseButton onClick={closeDialog} />
              </div>
              <div className="mt-3">
                <IncidentRevisionPanel
                  revision={selected}
                  title={
                    selected.status === "APPROVED"
                      ? "Approved changes"
                      : "Rejected changes"
                  }
                  variant="workspace"
                />
              </div>
              {selected.reviewed_by_name ? (
                <p className="mt-3 text-sm text-text-secondary">
                  Reviewed by {selected.reviewed_by_name} on{" "}
                  {selected.reviewed_at ? formatDateTimeColombo(selected.reviewed_at) : "—"}
                </p>
              ) : null}
            </>
          ) : (
            <>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">Change reviews</h2>
                  <p className="mt-1 text-sm text-text-secondary">
                    Past student edit requests on this incident. Pending reviews are handled
                    from the changes queue.
                  </p>
                </div>
                <DialogCloseButton onClick={closeDialog} />
              </div>
              <div className="mt-5 grid gap-6 md:grid-cols-2">
                <RevisionListSection
                  title="Approved"
                  items={approved}
                  onSelect={setSelected}
                />
                <RevisionListSection
                  title="Rejected"
                  items={rejected}
                  onSelect={setSelected}
                />
              </div>
            </>
          )}
        </div>
      </dialog>
    </>
  );
}
