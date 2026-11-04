import { useEffect, useState } from 'react';
import { MapPin } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import SampleMedia from '@/components/SampleMedia';

export default function World() {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.Location.list('order', 50).then((res) => {
      setLocations(Array.isArray(res) ? res : res.items || []);
      setLoading(false);
    });
  }, []);

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
        <h1 className="font-heading text-2xl text-foreground">העולם — Glow Grove</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          עולם טבע קסום וצבעוני. העולם מגיב בעדינות למעשים טובים: פרחים נפתחים כשהחברים שמחים, עצים מאירים
          כשמישהו עוזר לאחר, ואורות קטנים מופיעים כשנעשה מעשה טוב.
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {locations.map((location) => {
          const accent = location.accent_color || '#03A9F4';
          return (
            <div key={location.id} className="rounded-3xl border border-border bg-card p-4 shadow-sm">
              <SampleMedia label={location.name} color={accent} className="aspect-video w-full" />
              <h3 className="mt-3 flex items-center gap-1.5 font-heading text-base text-foreground">
                <MapPin className="h-4 w-4" style={{ color: accent }} />
                {location.name}
              </h3>
              <p className="mt-1 text-sm leading-relaxed text-foreground/75">{location.description}</p>
              <div className="mt-3 rounded-2xl bg-muted/60 p-3">
                <p className="text-[11px] font-semibold text-foreground/55">Environment Prompt</p>
                <p className="mt-1 font-mono text-[11px] leading-relaxed text-foreground/70" dir="ltr">
                  {location.environment_prompt}
                </p>
              </div>
              <div className="mt-3 flex gap-1.5">
                {(location.palette || []).map((c) => (
                  <span key={c} className="h-5 w-5 rounded-full border border-black/10" style={{ backgroundColor: c }} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}