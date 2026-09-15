type DetailJumpLinksProps = { actions?: boolean };

export function DetailJumpLinks({ actions = false }: DetailJumpLinksProps) {
  return (
    <nav
      aria-label="Incident sections"
      className="detail-jump-links mt-5 flex flex-wrap gap-2"
    >
      {actions ? (
        <a
          href="#incident-actions"
          className="inline-flex min-h-11 min-w-0 items-center justify-center px-4 text-sm"
        >
          Actions
        </a>
      ) : null}
      <a
        href="#incident-timeline"
        className="inline-flex min-h-11 min-w-0 items-center justify-center px-4 text-sm"
      >
        Progress
      </a>
    </nav>
  );
}
