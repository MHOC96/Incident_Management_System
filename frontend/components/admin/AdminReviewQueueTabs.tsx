"use client";

export type AdminReviewView =
  | "review"
  | "changes"
  | "assignment"
  | "underway"
  | "completed"
  | "rejected";

const VIEWS: { value: AdminReviewView; label: string }[] = [
  { value: "review", label: "New reports" },
  { value: "changes", label: "Pending changes" },
  { value: "assignment", label: "Awaiting assignment" },
  { value: "underway", label: "In progress" },
  { value: "completed", label: "Completed" },
  { value: "rejected", label: "Rejected" },
];

type AdminReviewQueueTabsProps = {
  activeView: AdminReviewView;
  counts: Record<AdminReviewView, number>;
  onChange: (view: AdminReviewView) => void;
};

export function AdminReviewQueueTabs({
  activeView,
  counts,
  onChange,
}: AdminReviewQueueTabsProps) {
  return (
    <div
      className="admin-review-tabs"
      role="tablist"
      aria-label="Administrator case queues"
    >
      {VIEWS.map((view) => {
        const count = counts[view.value];
        const isActive = activeView === view.value;
        return (
          <button
            key={view.value}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(view.value)}
            className={`admin-review-tab ${isActive ? "is-active" : ""}`}
          >
            <span>{view.label}</span>
            <span
              className={`admin-review-tab-count ${count > 0 ? "has-work" : ""}`}
              aria-label={`${count} items`}
            >
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function pickDefaultAdminView(counts: Record<AdminReviewView, number>): AdminReviewView {
  const order: AdminReviewView[] = ["review", "changes", "assignment", "underway", "rejected"];
  return order.find((view) => counts[view] > 0) ?? "review";
}

export function formatAdminAttentionSummary(counts: Record<AdminReviewView, number>): string {
  const parts: string[] = [];
  if (counts.review > 0) {
    parts.push(`${counts.review} new report${counts.review === 1 ? "" : "s"}`);
  }
  if (counts.changes > 0) {
    parts.push(`${counts.changes} pending change${counts.changes === 1 ? "" : "s"}`);
  }
  if (counts.assignment > 0) {
    parts.push(`${counts.assignment} awaiting assignment`);
  }
  if (counts.rejected > 0) {
    parts.push(`${counts.rejected} rejected report${counts.rejected === 1 ? "" : "s"}`);
  }
  if (parts.length === 0) {
    return "No reports are waiting for verification or change review.";
  }
  return `${parts.join(", ")} need your attention.`;
}
