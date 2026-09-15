"use client";

import { Button } from "./Button";

export function Pagination({ page, count, onChange }: {
  page: number; count: number; onChange: (page: number) => void;
}) {
  const pages = Math.max(1, Math.ceil(count / 20));
  if (pages <= 1) return null;
  return <nav aria-label="Results pages" className="flex flex-wrap items-center justify-between gap-3 border-t border-border p-4 text-sm">
    <Button variant="secondary" disabled={page <= 1} onClick={() => onChange(page - 1)}>Previous</Button>
    <span aria-live="polite">Page {page} of {pages} · {count} reports</span>
    <Button variant="secondary" disabled={page >= pages} onClick={() => onChange(page + 1)}>Next</Button>
  </nav>;
}
