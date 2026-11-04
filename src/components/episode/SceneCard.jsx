import { useState } from 'react';
import { RotateCcw, Loader2, Clock, MapPin } from 'lucide-react';
import SampleMedia from '@/components/SampleMedia';
import { Button } from '@/components/ui/button';
import { SCENE_STATUS_LABELS } from '@/lib/statuses';

export default function SceneCard({ scene, accent = '#03A9F4', onRegenerate, busy }) {
  const [showPrompt, setShowPrompt] = useState(false);

  return (
    <div className="rounded-3xl border border-border bg-card p-4 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row">
        <SampleMedia
          label={`סצנה ${scene.scene_number}`}
          color={accent}
          className="h-32 w-full shrink-0 sm:w-48"
        />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-heading text-sm text-foreground">סצנה {scene.scene_number}</span>
            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
              <Clock className="h-3 w-3" />
              {scene.duration} שניות
            </span>
            {scene.location && (
              <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                <MapPin className="h-3 w-3" />
                {scene.location}
              </span>
            )}
            <span className="rounded-full bg-brand-lilac px-2 py-0.5 text-[11px] text-brand-deep">
              {SCENE_STATUS_LABELS[scene.status] || scene.status}
            </span>
            {scene.asset_version > 0 && (
              <span className="font-mono text-[11px] text-muted-foreground">
                v{scene.asset_version}
              </span>
            )}
          </div>

          <p className="mt-2 text-sm leading-relaxed text-foreground/85">{scene.action}</p>

          {scene.dialogue?.length > 0 && (
            <ul className="mt-3 space-y-1.5 border-s-2 border-brand-blue/30 ps-3">
              {scene.dialogue.map((d, i) => (
                <li key={i} className="text-sm">
                  <span className="font-medium text-brand-deep">{d.character}: </span>
                  <span className="text-foreground/80">"{d.line}"</span>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
            {scene.emotion && <span>רגש: {scene.emotion}</span>}
            {scene.camera && <span>מצלמה: {scene.camera}</span>}
            {scene.sfx && <span>SFX: {scene.sfx}</span>}
            {scene.music && <span>מוזיקה: {scene.music}</span>}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowPrompt((v) => !v)}
              className="rounded-full bg-muted px-3 py-1 text-[11px] font-medium text-muted-foreground transition hover:bg-border"
            >
              {showPrompt ? 'הסתר פרומפט' : 'הצג פרומפט ויזואלי'}
            </button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onRegenerate(scene.id)}
              disabled={Boolean(busy)}
              className="gap-1.5 rounded-full text-[11px]"
            >
              {busy === `scene-${scene.id}` ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <RotateCcw className="h-3.5 w-3.5" />
              )}
              צור סצנה מחדש
            </Button>
          </div>

          {showPrompt && (
            <div className="mt-3 space-y-2 rounded-2xl bg-muted/60 p-3">
              <div>
                <p className="text-[11px] font-semibold text-foreground/60">Visual Prompt</p>
                <p className="mt-1 font-mono text-[11px] leading-relaxed text-foreground/70" dir="ltr">
                  {scene.visual_prompt}
                </p>
              </div>
              <div>
                <p className="text-[11px] font-semibold text-foreground/60">Negative Prompt</p>
                <p className="mt-1 font-mono text-[11px] leading-relaxed text-foreground/70" dir="ltr">
                  {scene.negative_prompt}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}