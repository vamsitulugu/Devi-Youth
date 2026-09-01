export default function EmptyState({ icon: Icon, title, subtitle }) {
  return (
    <div className="card empty-state">
      {Icon && (
        <div className="empty-state-icon-ring">
          <Icon size={26} strokeWidth={1.6} className="icon" />
        </div>
      )}
      {title && <div className="title">{title}</div>}
      {subtitle && <div className="subtitle">{subtitle}</div>}
    </div>
  );
}
