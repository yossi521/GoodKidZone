import { Coins } from 'lucide-react';
import { money, dateTime } from '@/lib/format';

const TYPE_LABELS = {
  story: 'סיפור',
  script: 'תסריט',
  image: 'תמונות',
  video: 'וידאו',
  voice: 'קולות',
  music: 'מוזיקה',
  thumbnail: 'Thumbnails',
  metadata: 'מטא-דאטה',
};

export default function CostPanel({ episode, costRows = [], generations = [] }) {
  const budget = episode.budget_max || 0;
  const total = episode.total_cost || 0;
  const percent = budget ? Math.min(100, Math.round((total / budget) * 100)) : 0;

  return (
    <div className="space-y-4">
      <div className="rounded-3xl border border-border bg-card p-4">
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-heading text-sm text-foreground">עלות הפרק</h3>
          <span className="flex items-center gap-1.5 text-sm font-medium text-foreground">
            <Coins className="h-4 w-4 text-brand-yellow" />
            {money(total)}
          </span>
        </div>
        <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-brand-blue"
            style={{ width: `${percent}%` }}
          />
        </div>
        <p className="mt-1.5 text-xs text-muted-foreground">
          {percent}% מתקציב הפרק ({money(budget)})
        </p>

        <ul className="mt-4 space-y-2">
          {costRows.map((row) => (
            <li key={row.generation_type} className="flex items-center justify-between text-sm">
              <span className="text-foreground/75">
                {TYPE_LABELS[row.generation_type] || row.generation_type}
                <span className="text-muted-foreground"> · {row.count} קריאות</span>
              </span>
              <span className="font-medium text-foreground">{money(row.sum_estimated_cost)}</span>
            </li>
          ))}
          {!costRows.length && <li className="text-sm text-muted-foreground">עדיין אין עלויות לפרק הזה.</li>}
        </ul>
      </div>

      <div className="rounded-3xl border border-border bg-card p-4">
        <h3 className="font-heading text-sm text-foreground">יומן יצירות AI</h3>
        <p className="mt-1 text-xs text-muted-foreground">כל קריאה נרשמת עם ספק, סוג, עלות וסטטוס.</p>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-muted-foreground">
                <th className="p-2 text-start font-medium">סוג</th>
                <th className="p-2 text-start font-medium">תיאור</th>
                <th className="p-2 text-start font-medium">ספק</th>
                <th className="p-2 text-start font-medium">עלות</th>
                <th className="p-2 text-start font-medium">מועד</th>
              </tr>
            </thead>
            <tbody>
              {generations.map((g) => (
                <tr key={g.id} className="border-t border-border">
                  <td className="p-2 text-foreground/80">{TYPE_LABELS[g.generation_type] || g.generation_type}</td>
                  <td className="p-2 text-foreground/70">{g.label}</td>
                  <td className="p-2 text-muted-foreground"><span dir="ltr">{g.provider}</span></td>
                  <td className="p-2 text-foreground/80">{money(g.estimated_cost)}</td>
                  <td className="p-2 text-muted-foreground">{dateTime(g.created_date)}</td>
                </tr>
              ))}
              {!generations.length && (
                <tr>
                  <td colSpan={5} className="p-3 text-center text-muted-foreground">
                    אין עדיין קריאות AI לפרק הזה.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}