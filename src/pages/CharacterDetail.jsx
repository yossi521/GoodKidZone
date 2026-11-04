import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';
import SampleMedia from '@/components/SampleMedia';
import PaletteRow from '@/components/PaletteRow';
import MiniMediaRow from '@/components/MiniMediaRow';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export default function CharacterDetail() {
  const { id } = useParams();
  const { toast } = useToast();
  const [character, setCharacter] = useState(null);
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    base44.entities.Character.get(id).then((c) => {
      setCharacter(c);
      setForm(c);
    });
  }, [id]);

  const set = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const handleSave = async () => {
    setSaving(true);
    await base44.entities.Character.update(id, {
      name: form.name,
      role_title: form.role_title,
      bio: form.bio,
      values: form.values,
      loves: form.loves,
      weakness: form.weakness,
      age_impression: form.age_impression,
      height_relative: form.height_relative,
      voice_id: form.voice_id,
      voice_description: form.voice_description,
      negative_prompt: form.negative_prompt,
      prompt_template: form.prompt_template,
    });
    setCharacter(form);
    setSaving(false);
    toast({ title: 'נשמר', description: 'ספר הדמות עודכן.' });
  };

  if (!character || !form) {
    return (
      <div className="flex justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-border border-t-brand-pink" />
      </div>
    );
  }

  const accent = character.accent_color || '#03A9F4';

  return (
    <div className="space-y-5">
      <Link to="/characters" className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-deep hover:underline">
        <ArrowRight className="h-3.5 w-3.5" />
        ספר הדמויות
      </Link>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="rounded-3xl border border-border p-5 shadow-sm" style={{ backgroundColor: character.bg_color || '#F7FBFF' }}>
          <h1 className="font-heading text-2xl" style={{ color: accent }}>{character.name}</h1>
          <p className="text-sm text-foreground/60">{character.role_title}</p>
          <span className="mt-2 inline-flex rounded-full bg-white/75 px-3 py-1 text-[11px] font-medium text-foreground/70">
            תפקיד בסיפור: {character.story_role}
          </span>
          <SampleMedia label={character.name} color={accent} className="mt-4 aspect-square w-full" />
          <p className="mt-4 text-sm leading-relaxed text-foreground/80">{character.description}</p>
          <MiniMediaRow title="הבעות" items={character.expressions} color={accent} />
          <MiniMediaRow title="תנוחות" items={character.poses} color={accent} />
          <MiniMediaRow title="רגשות" items={character.emotions} color={accent} />
          <PaletteRow colors={character.colors} />
        </div>

        <div className="space-y-4 lg:col-span-2">
          <div className="grid gap-4 rounded-3xl border border-border bg-card p-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="c-name">שם</Label>
              <Input id="c-name" dir="ltr" value={form.name || ''} onChange={set('name')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="c-role">תואר</Label>
              <Input id="c-role" dir="ltr" value={form.role_title || ''} onChange={set('role_title')} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="c-bio">ביוגרפיה קצרה</Label>
              <Textarea id="c-bio" dir="ltr" rows={2} value={form.bio || ''} onChange={set('bio')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="c-values">ערכים</Label>
              <Input id="c-values" dir="ltr" value={form.values || ''} onChange={set('values')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="c-loves">אוהב</Label>
              <Input id="c-loves" dir="ltr" value={form.loves || ''} onChange={set('loves')} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="c-weak">חולשה</Label>
              <Textarea id="c-weak" dir="ltr" rows={2} value={form.weakness || ''} onChange={set('weakness')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="c-age">רושם גיל</Label>
              <Input id="c-age" dir="ltr" value={form.age_impression || ''} onChange={set('age_impression')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="c-height">גובה יחסי</Label>
              <Input id="c-height" dir="ltr" value={form.height_relative || ''} onChange={set('height_relative')} />
            </div>
          </div>

          <div className="grid gap-4 rounded-3xl border border-border bg-card p-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="c-voice">Voice ID</Label>
              <Input id="c-voice" dir="ltr" value={form.voice_id || ''} onChange={set('voice_id')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="c-voicedesc">תיאור הקול</Label>
              <Input id="c-voicedesc" dir="ltr" value={form.voice_description || ''} onChange={set('voice_description')} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="c-neg">Negative Prompt</Label>
              <Textarea id="c-neg" dir="ltr" rows={2} value={form.negative_prompt || ''} onChange={set('negative_prompt')} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="c-prompt">תבנית פרומפט לדמות</Label>
              <Textarea id="c-prompt" dir="ltr" rows={3} value={form.prompt_template || ''} onChange={set('prompt_template')} />
            </div>
          </div>

          <div className="rounded-3xl border border-border bg-card p-5">
            <h3 className="font-heading text-sm text-foreground">מאפיינים פיזיים</h3>
            <div className="mt-2 flex flex-wrap gap-2">
              {(character.appearance || []).map((item) => (
                <span key={item} className="rounded-full bg-muted px-3 py-1 text-xs text-foreground/70" dir="ltr">
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-dashed border-border bg-card/60 p-5 text-sm text-muted-foreground">
            תמונות רפרנס מאושרות לדמות עדיין לא הועלו — במצב הנוכחי המערכת משתמשת בנכסי דוגמה. זה השלב שבו
            מוסיפים Reference Images לפני יצירת פרק אמיתי.
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={saving} className="rounded-2xl">
              שמור שינויים
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}