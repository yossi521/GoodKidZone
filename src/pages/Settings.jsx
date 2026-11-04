import { useEffect, useState } from 'react';
import { ShieldCheck, Save, Cpu } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';
import { PROVIDER_SLOTS } from '@/lib/providers';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

export default function Settings() {
  const { toast } = useToast();
  const [templates, setTemplates] = useState([]);
  const [drafts, setDrafts] = useState({});
  const [savingKey, setSavingKey] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.PromptTemplate.list('order', 50).then((res) => {
      const list = Array.isArray(res) ? res : res.items || [];
      setTemplates(list);
      setDrafts(Object.fromEntries(list.map((t) => [t.id, t.content || ''])));
      setLoading(false);
    });
  }, []);

  const handleSave = async (template) => {
    setSavingKey(template.id);
    await base44.entities.PromptTemplate.update(template.id, { content: drafts[template.id] });
    setSavingKey(null);
    toast({ title: 'נשמר', description: `הפרומפט "${template.name}" עודכן.` });
  };

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-border border-t-brand-blue" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl text-foreground">הגדרות המערכת</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          סגנון ויזואלי גלובלי, תבניות פרומפט וספקי ה-AI. שינוי כאן משפיע על כל הפרקים.
        </p>
      </div>

      <div className="rounded-3xl border border-brand-mint bg-brand-mint/40 p-5">
        <h2 className="font-heading text-sm text-foreground">מצב הפקה אמיתי</h2>
        <p className="mt-1 text-sm text-foreground/75">
          הסיפור, התסריט, התמונות והקריינות נוצרים ב-AI אמיתי, הפרק מורכב לקובץ MP4 דרך JSON2Video, וההעלאה
          ליוטיוב מתבצעת דרך YouTube Data API. כל פעולה צורכת קרדיטים אמיתיים — עקבו אחרי העלויות בכל פרק.
        </p>
      </div>

      <div className="rounded-3xl border border-border bg-card p-5">
        <h2 className="flex items-center gap-2 font-heading text-sm text-foreground">
          <Cpu className="h-4 w-4 text-muted-foreground" />
          ספקי AI
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          לכל שלב יש ספק נפרד, כדי שאפשר יהיה להחליף ספק בלי לשנות את שאר המערכת.
        </p>
        <ul className="mt-3 grid gap-3 sm:grid-cols-2">
          {PROVIDER_SLOTS.map((slot) => (
            <li key={slot.key} className="rounded-2xl border border-border p-3">
              <p className="text-sm font-medium text-foreground">{slot.label}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                פעיל: <span className="font-mono" dir="ltr">{slot.provider}{slot.model ? ` · ${slot.model}` : ''}</span>
              </p>
              {slot.alternatives.length > 0 && (
                <p className="mt-1 text-[11px] text-muted-foreground" dir="ltr">
                  ניתן להחליף ל: {slot.alternatives.join(' · ')}
                </p>
              )}
            </li>
          ))}
        </ul>
      </div>

      <div className="space-y-4">
        <h2 className="font-heading text-sm text-foreground">תבניות פרומפט</h2>
        {templates.map((template) => (
          <div key={template.id} className="rounded-3xl border border-border bg-card p-5">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h3 className="font-heading text-sm text-foreground">{template.name}</h3>
                <p className="text-xs text-muted-foreground">{template.description}</p>
              </div>
              <span className="rounded-full bg-muted px-2.5 py-1 font-mono text-[10px] text-muted-foreground" dir="ltr">
                {template.key}
              </span>
            </div>
            <Textarea
              dir="ltr"
              rows={template.key === 'GLOBAL_STYLE' ? 5 : 3}
              value={drafts[template.id] || ''}
              onChange={(e) => setDrafts((prev) => ({ ...prev, [template.id]: e.target.value }))}
              className="mt-3 font-mono text-xs"
            />
            <div className="mt-3 flex justify-end">
              <Button
                variant="outline"
                onClick={() => handleSave(template)}
                disabled={savingKey === template.id}
                className="gap-2 rounded-2xl"
              >
                <Save className="h-4 w-4" />
                שמור פרומפט
              </Button>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-3xl border border-border bg-card p-5">
        <h2 className="flex items-center gap-2 font-heading text-sm text-foreground">
          <ShieldCheck className="h-4 w-4 text-muted-foreground" />
          הרשאות ואבטחה
        </h2>
        <ul className="mt-3 space-y-2 text-sm text-foreground/75">
          <li><span className="font-medium">Admin (בעל הערוץ):</span> יצירה, עריכה, אישור, פרסום, ניהול דמויות, צפייה בעלויות.</li>
          <li><span className="font-medium">Developer:</span> פיתוח, בדיקות ותצורה טכנית — בלי הרשאת פרסום ליוטיוב.</li>
          <li>פרסום ליוטיוב מתאפשר רק לאחר אישור אנושי של הפרק.</li>
          <li>כל פעולה חשובה נרשמת ביומן הפעולות של הפרק (מי, מה, מתי, תוצאה).</li>
        </ul>
      </div>
    </div>
  );
}