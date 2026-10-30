"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"];
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_VIDEO_BYTES = 50 * 1024 * 1024;

type ImageUploadProps = {
  file: File | null;
  onChange: (file: File | null) => void;
  error?: string;
};

function isVideoFile(file: File): boolean {
  if (ALLOWED_VIDEO_TYPES.includes(file.type)) {
    return true;
  }
  const name = file.name.toLowerCase();
  return name.endsWith(".mp4") || name.endsWith(".webm") || name.endsWith(".mov");
}

export function ImageUpload({ file, onChange, error }: ImageUploadProps) {
  const [localError, setLocalError] = useState("");

  const previewUrl = useMemo(() => {
    if (!file) {
      return null;
    }
    return URL.createObjectURL(file);
  }, [file]);

  const previewIsVideo = file ? isVideoFile(file) : false;

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0];
    setLocalError("");

    if (!selected) {
      onChange(null);
      return;
    }

    const video = isVideoFile(selected);
    const allowed = video ? ALLOWED_VIDEO_TYPES : ALLOWED_IMAGE_TYPES;
    const maxSize = video ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;

    if (!video && !ALLOWED_IMAGE_TYPES.includes(selected.type) && !selected.name.match(/\.(jpe?g|png|webp)$/i)) {
      setLocalError("Only JPEG, PNG, WebP, MP4, WebM, or MOV files are allowed.");
      onChange(null);
      return;
    }

    if (video && !allowed.includes(selected.type) && !selected.name.match(/\.(mp4|webm|mov)$/i)) {
      setLocalError("Only MP4, WebM, and MOV videos are allowed.");
      onChange(null);
      return;
    }

    if (selected.size > maxSize) {
      setLocalError(
        video ? "Video must be 50 MB or smaller." : "Image must be 5 MB or smaller.",
      );
      onChange(null);
      return;
    }

    onChange(selected);
  }

  return (
    <div>
      <div className="rounded-lg border border-border bg-surface p-4">
        {previewUrl ? (
          <div className="space-y-3">
            {previewIsVideo ? (
              <div className="rounded-md border border-border bg-surface px-3 py-4 text-sm text-text-secondary">
                <p className="font-medium text-foreground">Video selected</p>
                <p className="mt-1 break-all">{file?.name}</p>
                <p className="mt-1 text-text-muted">
                  Preview is skipped for performance. The file will upload when you submit.
                </p>
              </div>
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previewUrl}
                alt="Evidence preview"
                className="block h-auto w-auto max-h-64 max-w-full rounded-md border border-border"
              />
            )}
            <p className="break-all text-sm text-text-secondary">{file?.name}</p>
            <Button type="button" variant="secondary" onClick={() => onChange(null)}>
              Remove file
            </Button>
          </div>
        ) : (
          <label className="upload-target flex min-h-32 cursor-pointer flex-col items-center justify-center gap-2 py-6 text-center md:min-h-40">
            <span className="text-sm font-medium text-foreground">Choose photo or video</span>
            <span className="text-sm text-text-muted">
              Images up to 5 MB · Videos (MP4, WebM, MOV) up to 50 MB
            </span>
            <input
              id="evidence"
              type="file"
              accept="image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov"
              className="sr-only"
              onChange={handleFileChange}
            />
            <span className="mt-2 inline-flex h-11 min-h-11 items-center rounded-md border border-border px-4 text-sm">
              Choose file
            </span>
          </label>
        )}
      </div>
      {localError || error ? (
        <p role="alert" className="mt-2 text-sm text-danger">
          {localError || error}
        </p>
      ) : null}
    </div>
  );
}
