import { PlayCircle, Film, ShieldCheck, Loader2, XCircle, CheckCircle2 } from 'lucide-react';
import SampleMedia from '@/components/SampleMedia';
import { Image } from '@/components/ui/image';
import { Button } from '@/components/ui/button';
import { money } from '@/lib/format';

export default function ProductionPanel({ episode, scenes, qa, accent, onAction, onRegenerate, busy }) {
  const assetsReady = scenes.length > 0 && scenes.every((s) => s.image_url && s.voice_url);
  const rendered = Boolean(episode.video_url);
  const renderPending = !rendered && Boolean(episode.render_project);
  const passedCount = qa.filter((q) => q.passed).length;
  const overBudget = episode.budget_max && episode.total_cost > episode.budget_max;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={() => onAction('produce_assets')} disabled={Boolean(busy)} className="gap-2 rounded-2xl">
          {busy === 'produce_assets' ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlayCircle className="h-4 w-4" />}
          {scenes.some((s) => s.asset_version > 0) ? 'הפק נכסים מחדש (תמונות, קריינות)' : 'הפק נכסים (תמונות, קריינות)'}
        </Button>
        <Button
          onClick={() => onAction('render_video')}
          disabled={Boolean(busy) || !assetsReady}
          className="gap-2 rounded-2xl"
        >
          {busy === 'render_video' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Film className="h-4 w-4" />}
          {renderPending ? 'בדוק מצב הרכבה' : 'הרכב קובץ וידאו (MP4)'}
        </Button>
        {scenes.length > 0 && (
          <Button variant="outline" onClick={() => onAction('run_qa')} disabled={Boolean(busy)} className="gap-2 rounded-2xl">
            <ShieldCheck className="h-4 w-4" />
            הרץ בקרת איכות
          </Button>
        )}
        <span className="text-xs text-muted-foreground">
          עלות מצטברת: {money(episode.total_cost)} מתוך {money(episode.budget_max)}
        </span>
      </div>

      {overBudget && (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          העלות הצפויה עוברת את תקציב הפרק — ההפקה נעצרת וממתינה לאישור תקציב.
        </div>
      )}

      {rendered && (
        <div className="rounded-3xl border border-border bg-card p-4">
          <h3 className="font-heading text-sm text-foreground">הפרק המורכב (MP4)</h3>
          <video controls className="mt-3 aspect-video w-full rounded-2xl bg-black" src={episode.video_url} />
        </div>
      )}

      <div className="rounded-3xl border border-border bg-card p-4">
        <h3 className="font-heading text-sm text-foreground">נכסי הסצנות</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          כל סצנה מקבלת תמונת AI וקריינות אמיתית. לחיצה על "צור סצנה מחדש" מייצרת גרסה חדשה בלי לגעת בשאר הפרק.
        </p>
        {scenes.length ? (
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {scenes.map((scene) => (
              <div key={scene.id} className="space-y-2">
                {scene.image_url ? (
                  <Image src={scene.image_url} fittingType="fill" className="aspect-video w-full" />
                ) : (
                  <SampleMedia
                    label={`סצנה ${scene.scene_number}`}
                    color={accent}
                    className="aspect-video w-full"
                    badge={scene.asset_version > 0 ? `v${scene.asset_version}` : 'טרם נוצר'}
                  />
                )}
                <button
                  onClick={() => onRegenerate(scene.id)}
                  disabled={Boolean(busy)}
                  className="w-full rounded-full bg-muted px-3 py-1 text-[11px] font-medium text-muted-foreground transition hover:bg-border disabled:opacity-50"
                >
                  צור סצנה מחדש
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">אין עדיין סצנות להפקה.</p>
        )}
      </div>

      <div className="rounded-3xl border border-border bg-card p-4">
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-heading text-sm text-foreground">בקרת איכות</h3>
          <span className="text-xs text-muted-foreground">
            {passedCount}/{qa.length} בדיקות עברו
          </span>
        </div>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {qa.map((item) => (
            <li key={item.label} className="flex items-start gap-2 text-sm">
              {item.passed ? (
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
              ) : (
                <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
              )}
              <span className={item.passed ? 'text-foreground/80' : 'text-destructive'}>{item.label}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}