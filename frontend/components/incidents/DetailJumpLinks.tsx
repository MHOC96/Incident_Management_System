type DetailJumpLinksProps = { actions?: boolean };

export function DetailJumpLinks({ actions = false }: DetailJumpLinksProps) {
  return (
    <nav aria-label="Incident sections" className="detail-jump-links">
      {actions && <a href="#incident-actions">Actions</a>}
      <a href="#incident-timeline">Progress</a>
    </nav>
  );
}
