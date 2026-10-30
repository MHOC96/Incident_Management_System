"use client";

import { useId, useRef, useState } from "react";
import type { IncidentImage } from "@/types";

type IncidentEvidenceProps = {
  images: IncidentImage[];
  title: string;
  compact?: boolean;
};

function isVideoMedia(item: IncidentImage): boolean {
  return item.media_type === "VIDEO";
}

export function IncidentEvidence({ images, title, compact = false }: IncidentEvidenceProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const headingId = useId();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const selected = images[selectedIndex];

  if (images.length === 0) {
    return (
      <p className="text-sm text-text-secondary">No photo or video was attached to this report.</p>
    );
  }

  return (
    <div>
      <div
        className={
          compact
            ? "grid gap-2"
            : "grid grid-cols-[repeat(auto-fit,minmax(min(100%,12rem),1fr))] justify-items-center gap-3"
        }
      >
        {images.map((item, index) => {
          const video = isVideoMedia(item);
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setSelectedIndex(index);
                dialogRef.current?.showModal();
              }}
              className={
                compact
                  ? "group w-full overflow-hidden rounded-sm border border-border text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                  : "group relative w-full max-w-80 overflow-hidden rounded-md border border-border focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
              }
              aria-label={`View evidence ${index + 1} related to ${title}`}
              aria-haspopup="dialog"
            >
              {video ? (
                <div
                  className={`flex w-full items-center justify-center bg-charcoal/90 text-white ${compact ? "aspect-[4/3] max-h-56" : "aspect-[16/9]"}`}
                >
                  <span className="text-sm font-medium">Video evidence</span>
                </div>
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.cloudinary_url}
                  alt={`Photo ${index + 1} related to ${title}`}
                  loading="lazy"
                  className={`w-full object-cover ${compact ? "aspect-[4/3] max-h-56" : "aspect-[16/9]"}`}
                />
              )}
              {!compact ? (
                <span className="flex min-h-11 items-center justify-center bg-surface px-2 text-sm font-medium text-primary group-hover:underline">
                  View {video ? "video" : "photo"} {images.length > 1 ? index + 1 : ""}
                </span>
              ) : (
                <span className="block px-2 py-2 text-xs font-medium text-primary group-hover:underline">
                  Tap to open{images.length > 1 ? ` (${index + 1}/${images.length})` : ""}
                </span>
              )}
            </button>
          );
        })}
      </div>
      <dialog
        ref={dialogRef}
        aria-labelledby={headingId}
        className="fixed inset-0 m-auto max-h-[92dvh] w-[calc(100%_-_2rem)] max-w-5xl overflow-auto rounded-md border border-border bg-surface p-4 backdrop:bg-black/70"
        onClick={(event) => {
          if (event.target === event.currentTarget) dialogRef.current?.close();
        }}
      >
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 id={headingId} className="text-base font-semibold">
            Evidence {selectedIndex + 1} of {images.length}
          </h2>
          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            className="min-h-11 rounded-md border border-border px-4 text-sm font-medium"
          >
            Close
          </button>
        </div>
        {selected ? (
          isVideoMedia(selected) ? (
            <video
              src={selected.cloudinary_url}
              controls
              className="mx-auto block max-h-[65dvh] w-full max-w-full bg-black"
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={selected.cloudinary_url}
              alt={`Photo ${selectedIndex + 1} related to ${title}`}
              className="mx-auto block h-auto max-h-[65dvh] w-auto max-w-full object-contain"
            />
          )
        ) : null}
        {images.length > 1 ? (
          <div className="mt-3 flex justify-between gap-3">
            <button
              type="button"
              disabled={selectedIndex === 0}
              onClick={() => setSelectedIndex((index) => index - 1)}
              className="min-h-11 rounded-md border border-border px-4 text-sm disabled:opacity-40"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={selectedIndex === images.length - 1}
              onClick={() => setSelectedIndex((index) => index + 1)}
              className="min-h-11 rounded-md border border-border px-4 text-sm disabled:opacity-40"
            >
              Next
            </button>
          </div>
        ) : null}
      </dialog>
    </div>
  );
}
