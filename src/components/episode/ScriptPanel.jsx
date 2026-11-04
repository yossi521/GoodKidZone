import { Sparkles, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SceneCard from '@/components/episode/SceneCard';

export default function ScriptPanel({ episode, scenes, accent, onAction, onRegenerate, busy }) {
  const hasScenes = scenes.length > 0;
  const totalSeconds = scenes.reduce((sum, s) => sum + (s.duration || 0), 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={() => onAction('generate_script')} disabled={Boolean(busy)} className="gap-2 rounded-2xl">
          {busy === 'generate_script' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {hasScenes ? 'צור תסריט מחדש' : 'צור תסריט וסצנות'}
        </Button>
        {hasScenes && (
          <Button
            variant="outline"
            onClick={() => onAction('approve_script')}
            disabled={Boolean(busy)}
            className="gap-2 rounded-2xl"
          >
            <Check className="h-4 w-4" />
            אשר תסריט
          </Button>
        )}
        {hasScenes && (
          <span className="text-xs text-muted-foreground">
            {scenes.length} סצנות · {Math.round(totalSeconds / 60)} דקות סה"כ
          </span>
        )}
      </div>

      {hasScenes ? (
        <div className="space-y-3">
          {scenes.map((scene) => (
            <SceneCard
              key={scene.id}
              scene={scene}
              accent={accent}
              onRegenerate={onRegenerate}
              busy={busy}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-border bg-card/60 p-8 text-center">
          <p className="text-sm text-muted-foreground">
            עדיין אין תסריט. לחצו "צור תסריט וסצנות" והמערכת תבנה 8 סצנות עם דיאלוג, מצלמה, SFX ופרומפט ויזואלי.
          </p>
        </div>
      )}
    </div>
  );
}