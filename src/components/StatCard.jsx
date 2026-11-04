export default function StatCard({ icon: Icon, label, value, tone = '#03A9F4', hint }) {
  return (
    <div className="rounded-3xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-center gap-3">
        {Icon && (
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl" style={{ backgroundColor: `${tone}22` }}>
            <Icon className="h-5 w-5" style={{ color: tone }} />
          </span>
        )}
        <div className="min-w-0">
          <p className="truncate text-xs text-muted-foreground">{label}</p>
          <p className="font-heading text-2xl leading-tight text-foreground">{value}</p>
        </div>
      </div>
      {hint && <p className="mt-2 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}