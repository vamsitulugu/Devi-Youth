export default function EmptyState({ icon: Icon, title, subtitle }) {
  return (
    <div className="card empty-state">
      {Icon && <Icon size={28} strokeWidth={1.5} className="icon" />}
      {title && <div className="title">{title}</div>}
      {subtitle && <div className="subtitle">{subtitle}</div>}
    </div>
  );
}
