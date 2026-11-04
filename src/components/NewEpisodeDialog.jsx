import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { STORY_VALUES, STORY_TOPICS } from '@/lib/contentOptions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function NewEpisodeDialog() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [saving, setSaving] = useState(false);
  const [characters, setCharacters] = useState([]);
  const [locations, setLocations] = useState([]);
  const [title, setTitle] = useState('');
  const [value, setValue] = useState('Kindness');
  const [topic, setTopic] = useState('Adventure');
  const [location, setLocation] = useState('');
  const [slugs, setSlugs] = useState([]);

  // הדמויות והמקומות נטענים בפתיחת החלון, כדי שברירות המחדל תמיד יהיו מעודכנות
  const handleOpenChange = async (next) => {
    setOpen(next);
    if (!next) return;
    setTitle('');
    setValue('Kindness');
    setTopic('Adventure');
    setSlugs([]);
    setLocation('');
    setLoadingOptions(true);
    const [chars, locs] = await Promise.all([
      base44.entities.Character.list(),
      base44.entities.Location.list('order', 50),
    ]);
    const charList = Array.isArray(chars) ? chars : chars.items || [];
    const locList = Array.isArray(locs) ? locs : locs.items || [];
    setCharacters(charList);
    setLocations(locList);
    setSlugs(charList.map((c) => c.slug));
    setLocation(locList[0]?.name || '');
    setLoadingOptions(false);
  };

  const toggleSlug = (slug) =>
    setSlugs((prev) => (prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]));

  const handleCreate = async () => {
    if (!title.trim()) return;
    setSaving(true);
    const last = await base44.entities.Episode.filter({}, { sort: '-episode_number', limit: 1 });
    const nextNumber = (last.items?.[0]?.episode_number || 0) + 1;
    const created = await base44.entities.Episode.create({
      episode_number: nextNumber,
      title: title.trim(),
      status: 'idea',
      value,
      topic,
      location: location || locations[0]?.name || 'Glow Grove',
      target_age: '3-6',
      language: 'English',
      duration_target: '6-8 דקות',
      character_slugs: slugs,
      budget_max: 5,
      total_cost: 0,
      values: [value],
      cover_color: characters.find((c) => c.slug === slugs[0])?.accent_color || '#03A9F4',
    });
    setSaving(false);
    setOpen(false);
    navigate(`/episodes/${created.id}`);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="gap-2 rounded-2xl">
          <Plus className="h-4 w-4" />
          פרק חדש
        </Button>
      </DialogTrigger>
      <DialogContent dir="rtl" className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-heading">יצירת פרק חדש</DialogTitle>
          <DialogDescription>
            בוחרים רעיון, ערך ומקום — והמערכת תייצר סיפור, תסריט וסצנות.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ep-title">שם הפרק</Label>
            <Input
              id="ep-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="The Little Lost Star"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>ערך מרכזי</Label>
              <Select value={value} onValueChange={setValue}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STORY_VALUES.map((v) => (
                    <SelectItem key={v} value={v}>
                      {v}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>סוג סיפור</Label>
              <Select value={topic} onValueChange={setTopic}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STORY_TOPICS.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>מקום ב-Glow Grove</Label>
            <Select value={location} onValueChange={setLocation}>
              <SelectTrigger>
                <SelectValue placeholder="טוען מקומות..." />
              </SelectTrigger>
              <SelectContent>
                {locations.map((l) => (
                  <SelectItem key={l.id} value={l.name}>
                    {l.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>דמויות</Label>
            <div className="flex flex-wrap gap-2">
              {characters.map((c) => {
                const active = slugs.includes(c.slug);
                return (
                  <button
                    key={c.slug}
                    type="button"
                    onClick={() => toggleSlug(c.slug)}
                    className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
                      active ? 'text-white' : 'bg-muted text-muted-foreground'
                    }`}
                    style={active ? { backgroundColor: c.accent_color || '#03A9F4' } : undefined}
                  >
                    {c.name}
                  </button>
                );
              })}
              {loadingOptions && <span className="text-sm text-muted-foreground">טוען...</span>}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            onClick={handleCreate}
            disabled={saving || loadingOptions || !title.trim()}
            className="gap-2 rounded-2xl"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            צור פרק
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}