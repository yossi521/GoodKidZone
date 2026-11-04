import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import EpisodeCard from '@/components/EpisodeCard';
import NewEpisodeDialog from '@/components/NewEpisodeDialog';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { STATUS_LABELS, STATUS_ORDER } from '@/lib/statuses';

export default function Episodes() {
  const [episodes, setEpisodes] = useState([]);
  const [status, setStatus] = useState('all');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const filter = {};
    if (status !== 'all') filter.status = status;
    if (query.trim()) filter.title = { $regex: query.trim(), $options: 'i' };

    base44.entities.Episode.filter(filter, { sort: '-episode_number', limit: 50 }).then((page) => {
      setEpisodes(page.items || []);
      setLoading(false);
    });
  }, [status, query]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl text-foreground">פרקים</h1>
          <p className="text-sm text-muted-foreground">
            יצירת פרק חדש, מעבר בין שלבי ההפקה ואישור לפרסום.
          </p>
        </div>
        <NewEpisodeDialog />
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative min-w-56 flex-1">
          <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="חיפוש לפי שם פרק..."
            className="ps-9"
          />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">כל הסטטוסים</SelectItem>
            {STATUS_ORDER.map((s) => (
              <SelectItem key={s} value={s}>
                {STATUS_LABELS[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="h-7 w-7 animate-spin rounded-full border-4 border-border border-t-brand-blue" />
        </div>
      ) : episodes.length ? (
        <div className="grid gap-3 xl:grid-cols-2">
          {episodes.map((episode) => (
            <EpisodeCard key={episode.id} episode={episode} />
          ))}
        </div>
      ) : (
        <div className="rounded-3xl border border-dashed border-border bg-card/60 p-10 text-center text-sm text-muted-foreground">
          לא נמצאו פרקים. אפשר ליצור פרק חדש ולהתחיל את תהליך ההפקה.
        </div>
      )}
    </div>
  );
}