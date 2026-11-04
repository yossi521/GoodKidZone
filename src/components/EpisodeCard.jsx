import { Link } from 'react-router-dom';
import { Clapperboard } from 'lucide-react';
import StatusBadge from '@/components/StatusBadge';
import { money } from '@/lib/format';

export default function EpisodeCard({ episode }) {
  const color = episode.cover_color || '#03A9F4';

  return (
    <Link
      to={`/episodes/${episode.id}`}
      className="group flex gap-4 rounded-3xl border border-border bg-card p-4 shadow-sm transition hover:shadow-md"
    >
      <div
        className="relative grid h-20 w-28 shrink-0 place-items-center overflow-hidden rounded-2xl"
        style={{ background: `linear-gradient(135deg, ${color}22, ${color}55)` }}
      >
        <Clapperboard className="h-6 w-6" style={{ color }} />
        <span className="absolute bottom-1 end-1 rounded-full bg-card/85 px-1.5 text-[10px] font-medium text-muted-foreground">
          #{String(episode.episode_number || 0).padStart(3, '0')}
        </span>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="truncate font-heading text-base text-foreground group-hover:text-brand-deep">
            {episode.title}
          </h3>
          <StatusBadge status={episode.status} />
        </div>
        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
          {episode.moral || episode.story_concept || 'טרם נוצר תוכן לפרק'}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
          {episode.value && <span>ערך: {episode.value}</span>}
          {episode.duration_target && <span>{episode.duration_target}</span>}
          <span>עלות: {money(episode.total_cost)}</span>
        </div>
      </div>
    </Link>
  );
}