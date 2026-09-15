"use client";

export type DeanQueueView = "underway" | "assignment" | "close";

const VIEWS: { value: DeanQueueView; label: string }[] = [
  { value: "underway", label: "Currently underway" },
  { value: "assignment", label: "Needs assignment" },
  { value: "close", label: "Ready to close" },
];

type DeanReviewQueueTabsProps = {
  activeView: DeanQueueView;
  counts: Record<DeanQueueView, number>;
  onChange: (view: DeanQueueView) => void;
};

export function DeanReviewQueueTabs({
  activeView,
  counts,
  onChange,
}: DeanReviewQueueTabsProps) {
  return (
    <div className="admin-review-tabs" role="tablist" aria-label="Dean incident queues">
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

export function pickDefaultDeanView(counts: Record<DeanQueueView, number>): DeanQueueView {
  const order: DeanQueueView[] = ["assignment", "close", "underway"];
  return order.find((view) => counts[view] > 0) ?? "underway";
}
