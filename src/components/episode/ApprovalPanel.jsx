import { useState } from 'react';
import { Check, Undo2, Upload, Loader2, Save } from 'lucide-react';
import SampleMedia from '@/components/SampleMedia';
import { Image } from '@/components/ui/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function ApprovalPanel({ episode, scenes, accent, onAction, onSaveMeta, busy }) {
  const [title, setTitle] = useState(episode.youtube_title || '');
  const [description, setDescription] = useState(episode.youtube_description || '');
  const [visibility, setVisibility] = useState(episode.youtube_visibility || 'private');
  const [scheduledAt, setScheduledAt] = useState(episode.scheduled_at || '');
  const [saving, setSaving] = useState(false);

  const canApprove = ['human_approval', 'qa'].includes(episode.status);
  const canPublish = ['ready_to_upload', 'scheduled', 'published'].includes(episode.status);

  const handleSave = async () => {
    setSaving(true);
    await onSaveMeta({ youtube_title: title, youtube_description: description, youtube_visibility: visibility, scheduled_at: scheduledAt });
    setSaving(false);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-3xl border border-border bg-card p-4">
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-heading text-sm text-foreground">תצוגה מקדימה</h3>
          <span className="text-xs text-muted-foreground">
            {scenes.length} סצנות
          </span>
        </div>
        {episode.video_url ? (
          <video controls className="mt-3 aspect-video w-full rounded-2xl bg-black" src={episode.video_url} />
        ) : (
          <SampleMedia
            label="Final Preview — יורכב לאחר יצירת הווידאו"
            color={accent}
            className="mt-3 aspect-video w-full"
            rounded="rounded-2xl"
            badge={null}
          />
        )}
        {scenes.length > 0 && (
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {scenes.map((scene) =>
              scene.image_url ? (
                <Image
                  key={scene.id}
                  src={scene.image_url}
                  fittingType="fill"
                  className="h-14 w-20 shrink-0 rounded-xl"
                />
              ) : (
                <SampleMedia
                  key={scene.id}
                  label={`${scene.scene_number}`}
                  color={accent}
                  badge={null}
                  className="h-14 w-20 shrink-0"
                  rounded="rounded-xl"
                />
              ),
            )}
          </div>
        )}
      </div>

      <div className="rounded-3xl border border-border bg-card p-4">
        <h3 className="font-heading text-sm text-foreground">אישור אנושי</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          רק לאחר אישור הפרק ניתן להעלות אותו ליוטיוב. אפשר גם להחזיר לתיקון ולעבוד על סצנה בודדת.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button onClick={() => onAction('approve_episode')} disabled={Boolean(busy) || !canApprove} className="gap-2 rounded-2xl">
            {busy === 'approve_episode' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            אשר פרק
          </Button>
          <Button variant="outline" onClick={() => onAction('send_back')} disabled={Boolean(busy)} className="gap-2 rounded-2xl">
            <Undo2 className="h-4 w-4" />
            החזר לתיקון
          </Button>
        </div>
        {episode.approved_at && (
          <p className="mt-2 text-xs text-emerald-700">הפרק אושר להעלאה.</p>
        )}
      </div>

      <div className="rounded-3xl border border-border bg-card p-4">
        <h3 className="font-heading text-sm text-foreground">מטא-דאטה ליוטיוב</h3>
        <div className="mt-3 space-y-3">
          <div className="space-y-2">
            <Label htmlFor="yt-title">כותרת</Label>
            <Input id="yt-title" dir="ltr" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="yt-desc">תיאור</Label>
            <Textarea id="yt-desc" dir="ltr" rows={4} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>נראות</Label>
              <Select value={visibility} onValueChange={setVisibility}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="private">פרטי</SelectItem>
                  <SelectItem value="unlisted">לא רשום</SelectItem>
                  <SelectItem value="public">ציבורי</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="yt-sched">תזמון פרסום (אופציונלי)</Label>
              <Input id="yt-sched" type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} />
            </div>
          </div>
          {episode.youtube_tags?.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {episode.youtube_tags.map((tag) => (
                <span key={tag} className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground" dir="ltr">
                  {tag}
                </span>
              ))}
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={handleSave} disabled={saving} className="gap-2 rounded-2xl">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              שמור מטא-דאטה
            </Button>
            <Button
              onClick={() => onAction('publish', { visibility, scheduledAt })}
              disabled={Boolean(busy) || !canPublish}
              className="gap-2 rounded-2xl"
            >
              {busy === 'publish' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {scheduledAt ? 'תזמן העלאה ליוטיוב' : 'העלה ליוטיוב'}
            </Button>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Made for Kids = TRUE · ההעלאה מתבצעת באמת דרך YouTube Data API. קובץ ה-MP4 מאוחסן אצל JSON2Video עד 7 ימים — מומלץ להעלות בהקדם.
          </p>
        </div>
      </div>
    </div>
  );
}