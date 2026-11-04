export default function PaletteRow({ colors = [] }) {
  if (!colors.length) return null;
  return (
    <div className="mt-4">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-foreground/50">פלטת צבעים</p>
      <div className="flex flex-wrap gap-2">
        {colors.map((c) => (
          <div key={c} className="flex items-center gap-1.5 rounded-full bg-white/70 px-2 py-1">
            <span className="h-4 w-4 rounded-full border border-black/10" style={{ backgroundColor: c }} />
            <span className="font-mono text-[11px] text-foreground/60">{c}</span>
          </div>
        ))}
      </div>
    </div>
  );
}