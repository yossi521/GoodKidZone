import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Clapperboard, CheckCircle2, Clock, PencilLine, Coins, AlertTriangle, Sun } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import StatCard from '@/components/StatCard';
import EpisodeCard from '@/components/EpisodeCard';
import { money } from '@/lib/format';

const DRAFT_STATUSES = ['idea', 'story_draft', 'story_approval', 'script_draft', 'script_approval'];

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, published: 0, approval: 0, draft: 0, failed: 0, cost: 0 });
  const [recent, setRecent] = useState([]);
  const [waiting, setWaiting] = useState([]);

  useEffect(() => {
    const load = async () => {
      const [agg, list, waitingPage] = await Promise.all([
        base44.entities.Episode.aggregate({ groupBy: 'status', sum: ['total_cost'] }),
        base44.entities.Episode.filter({}, { sort: '-updated_date', limit: 6 }),
        base44.entities.Episode.filter({ status: 'human_approval' }, { sort: '-updated_date', limit: 5 }),
      ]);
      const rows = agg?.rows || [];
      const sum = (fn) => rows.reduce((acc, r) => acc + (fn(r) || 0), 0);
      setStats({
        total: sum((r) => r.count),
        published: sum((r) => (r.status === 'published' ? r.count : 0)),
        approval: sum((r) => (r.status === 'human_approval' ? r.count : 0)),
        draft: sum((r) => (DRAFT_STATUSES.includes(r.status) ? r.count : 0)),
        failed: sum((r) => (r.status === 'failed' ? r.count : 0)),
        cost: sum((r) => r.sum_total_cost),
      });
      setRecent(list.items || []);
      setWaiting(waitingPage.items || []);
      setLoading(false);
    };
    load();
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
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-bl from-brand-blue/15 via-brand-yellow/15 to-brand-pink/15 p-6 md:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-yellow shadow-sm">
              <Sun className="h-6 w-6 text-white" />
            </span>
            <div>
              <h1 className="font-heading text-3xl text-brand-deep md:text-4xl">GoodKid Zone</h1>
              <p className="text-xs font-medium tracking-wide text-foreground/60">
                Small Hearts • Big Values • A Brighter World
              </p>
            </div>
          </div>
          <p className="max-w-xs text-sm leading-relaxed text-foreground/70">
            Together we learn, help, respect and make the world a kinder place! ♡
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard icon={Clapperboard} label='סה"כ פרקים' value={stats.total} tone="#03A9F4" />
        <StatCard icon={CheckCircle2} label="פורסמו" value={stats.published} tone="#059669" />
        <StatCard icon={Clock} label="ממתינים לאישור" value={stats.approval} tone="#FFC107" />
        <StatCard icon={PencilLine} label="בתהליך" value={stats.draft} tone="#9C27B0" />
        <StatCard icon={AlertTriangle} label="נכשלו" value={stats.failed} tone="#E91E63" />
        <StatCard icon={Coins} label="עלות AI" value={money(stats.cost)} tone="#0288D1" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="space-y-3 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-lg text-foreground">פרקים אחרונים</h2>
            <Link to="/episodes" className="text-xs font-medium text-brand-deep hover:underline">
              לכל הפרקים
            </Link>
          </div>
          {recent.map((episode) => (
            <EpisodeCard key={episode.id} episode={episode} />
          ))}
        </section>

        <section className="space-y-3">
          <h2 className="font-heading text-lg text-foreground">דורש אישור</h2>
          {waiting.length ? (
            waiting.map((episode) => <EpisodeCard key={episode.id} episode={episode} />)
          ) : (
            <div className="rounded-3xl border border-dashed border-border bg-card/60 p-6 text-center text-sm text-muted-foreground">
              אין פרקים שממתינים לאישור כרגע.
            </div>
          )}
        </section>
      </div>
    </div>
  );
}