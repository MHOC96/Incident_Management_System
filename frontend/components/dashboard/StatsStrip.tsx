import Link from "next/link";

type StatItem = {
  value: number;
  label: string;
  href?: string;
};

type StatsStripProps = {
  items: StatItem[];
};

export function StatsStrip({ items }: StatsStripProps) {
  return (
    <div className={`stats-strip mb-6 grid grid-cols-2 gap-4 border border-border bg-surface p-4 sm:gap-6 sm:p-6 md:mb-8 ${items.length === 5 ? "md:grid-cols-5" : "md:grid-cols-4"}`}>
      {items.map((item) => {
        const content = (
          <>
            <p className="text-[22px] font-semibold leading-none">{item.value}</p>
            <p className="mt-2 text-sm text-text-secondary">{item.label}</p>
          </>
        );

        if (item.href) {
          return (
            <Link
              key={item.label}
              href={item.href}
              className="min-w-0 rounded-md no-underline hover:text-inherit focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              {content}
            </Link>
          );
        }

        return (
          <div key={item.label} className="min-w-0">
            {content}
          </div>
        );
      })}
    </div>
  );
}
