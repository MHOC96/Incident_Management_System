"use client";

export type OfficialQueueView = "active" | "completed";

const VIEWS: { value: OfficialQueueView; label: string }[] = [
  { value: "active", label: "Active assignments" },
  { value: "completed", label: "Completed" },
];

type AuthorityReviewQueueTabsProps = {
  activeView: OfficialQueueView;
  counts: Record<OfficialQueueView, number>;
  onChange: (view: OfficialQueueView) => void;
};

export function AuthorityReviewQueueTabs({
  activeView,
  counts,
  onChange,
}: AuthorityReviewQueueTabsProps) {
  return (
    <div className="admin-review-tabs" role="tablist" aria-label="Authority case queues">
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

export function pickDefaultOfficialView(
  counts: Record<OfficialQueueView, number>,
): OfficialQueueView {
  if (counts.active > 0) {
    return "active";
  }
  if (counts.completed > 0) {
    return "completed";
  }
  return "active";
}
