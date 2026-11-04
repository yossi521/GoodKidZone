import { Sparkles } from 'lucide-react';

// נכסי דוגמה: כל המדיה במערכת מוצגת כמציין מקום עד להחלפה בנכס AI אמיתי.
export default function SampleMedia({
  label,
  color = '#03A9F4',
  icon: Icon = Sparkles,
  className = '',
  rounded = 'rounded-2xl',
  badge = 'נכס דוגמה',
}) {
  return (
    <div
      className={`relative overflow-hidden ${rounded} ${className}`}
      style={{ background: `linear-gradient(135deg, ${color}1f, ${color}4d 55%, ${color}1f)` }}
    >
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-3 text-center">
        <span className="grid h-11 w-11 place-items-center rounded-full" style={{ backgroundColor: `${color}33` }}>
          <Icon className="h-5 w-5" style={{ color }} />
        </span>
        {label && <span className="max-w-full truncate text-xs font-medium text-foreground/70">{label}</span>}
      </div>
      {badge && (
        <span className="absolute end-2 top-2 rounded-full bg-card/85 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
          {badge}
        </span>
      )}
    </div>
  );
}