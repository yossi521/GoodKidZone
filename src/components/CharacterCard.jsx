import { Link } from 'react-router-dom';
import { Heart, Star, Leaf } from 'lucide-react';
import SampleMedia from '@/components/SampleMedia';
import PaletteRow from '@/components/PaletteRow';
import MiniMediaRow from '@/components/MiniMediaRow';

export default function CharacterCard({ character }) {
  const accent = character.accent_color || '#03A9F4';
  const stats = [
    { icon: Heart, label: 'ערכים', value: character.values },
    { icon: Star, label: 'אופי', value: (character.personality || []).join(' · ') },
    { icon: Leaf, label: 'אוהב', value: character.loves },
  ];

  return (
    <div
      className="flex flex-col rounded-3xl border border-black/5 p-5 shadow-sm"
      style={{ backgroundColor: character.bg_color || '#F7FBFF' }}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-heading text-2xl leading-tight" style={{ color: accent }}>
            {character.name}
          </h3>
          <p className="text-sm text-foreground/60">{character.role_title}</p>
        </div>
        <Link
          to={`/characters/${character.id}`}
          className="shrink-0 rounded-full bg-white/75 px-3 py-1 text-xs font-medium text-foreground/70 transition hover:bg-white"
        >
          ספר הדמות
        </Link>
      </div>

      <SampleMedia label={character.name} color={accent} className="mt-4 aspect-square w-full" />

      <p className="mt-4 text-sm leading-relaxed text-foreground/80">{character.bio}</p>

      <ul className="mt-4 space-y-2">
        {stats.map((s) => (
          <li key={s.label} className="flex items-start gap-2 text-sm">
            <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-white/75">
              <s.icon className="h-3.5 w-3.5" style={{ color: accent }} />
            </span>
            <span>
              <span className="font-medium text-foreground/60">{s.label}: </span>
              <span className="text-foreground/80">{s.value || '—'}</span>
            </span>
          </li>
        ))}
      </ul>

      <MiniMediaRow title="הבעות" items={character.expressions} color={accent} />
      <MiniMediaRow title="תנוחות" items={character.poses} color={accent} />
      <PaletteRow colors={character.colors} />
    </div>
  );
}