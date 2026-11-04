import { Sparkles, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

const FIELDS = [
  { key: 'story_concept', label: 'קונספט' },
  { key: 'story_conflict', label: 'קונפליקט מרכזי' },
  { key: 'story_arc', label: 'קשת רגשית' },
  { key: 'story_ending', label: 'סיום' },
  { key: 'moral', label: 'המסר' },
];

export default function StoryPanel({ episode, onAction, busy }) {
  const hasStory = Boolean(episode.story_concept);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={() => onAction('generate_story')} disabled={Boolean(busy)} className="gap-2 rounded-2xl">
          {busy === 'generate_story' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {hasStory ? 'צור סיפור מחדש' : 'צור סיפור'}
        </Button>
        {hasStory && (
          <Button
            variant="outline"
            onClick={() => onAction('approve_story')}
            disabled={Boolean(busy)}
            className="gap-2 rounded-2xl"
          >
            <Check className="h-4 w-4" />
            אשר סיפור
          </Button>
        )}
      </div>

      {hasStory ? (
        <dl className="grid gap-3 sm:grid-cols-2">
          {FIELDS.filter((f) => episode[f.key]).map((f) => (
            <div key={f.key} className="rounded-2xl border border-border bg-card p-4">
              <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{f.label}</dt>
              <dd className="mt-1.5 text-sm leading-relaxed text-foreground/85">{episode[f.key]}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <div className="rounded-2xl border border-dashed border-border bg-card/60 p-8 text-center">
          <p className="text-sm text-muted-foreground">
            עדיין אין סיפור לפרק הזה. לחצו "צור סיפור" והמערכת תבנה קונספט, קונפליקט, קשת רגשית ומסר.
          </p>
        </div>
      )}
    </div>
  );
}