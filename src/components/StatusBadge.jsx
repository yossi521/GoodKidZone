import { STATUS_CLASSES, STATUS_LABELS } from '@/lib/statuses';

export default function StatusBadge({ status, className = '' }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${
        STATUS_CLASSES[status] || 'bg-muted text-muted-foreground'
      } ${className}`}
    >
      {STATUS_LABELS[status] || status}
    </span>
  );
}