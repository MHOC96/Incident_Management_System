import type { ReactNode } from "react";

type IncidentSectionProps = {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
  compact?: boolean;
};

export function IncidentSection({
  title,
  description,
  children,
  className = "",
  compact = false,
}: IncidentSectionProps) {
  return (
    <section
      className={`incident-section border border-border bg-surface ${
        compact ? "p-3 md:p-4" : "p-4 md:p-6"
      } ${className}`}
    >
      <h2 className={`font-semibold ${compact ? "text-base" : "text-[18px]"}`}>{title}</h2>
      {description ? (
        <p className={`mt-1 text-sm text-text-muted ${compact ? "mb-3" : "mb-4"}`}>{description}</p>
      ) : compact ? (
        <div className="mb-3" />
      ) : (
        <div className="mb-4" />
      )}
      {children}
    </section>
  );
}
