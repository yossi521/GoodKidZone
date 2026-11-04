import { useEffect, useState } from 'react';
import { Eye, Clock, Users, ThumbsUp, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { base44 } from '@/api/base44Client';
import StatCard from '@/components/StatCard';
import { num, shortDate } from '@/lib/format';

export default function Analytics() {
  const [loading, setLoading] = useState(true);
  const [totals, setTotals] = useState({});
  const [published, setPublished] = useState([]);
  const [diversity, setDiversity] = useState([]);

  useEffect(() => {
    Promise.all([
      base44.entities.Episode.aggregate({
        query: { status: 'published' },
        groupBy: 'status',
        sum: ['views', 'watch_time_hours', 'subscribers_gained', 'likes'],
        avg: ['retention', 'ctr'],
      }),
      base44.entities.Episode.filter({ status: 'published' }, { sort: '-published_at', limit: 50 }),
      base44.entities.Episode.aggregate({ groupBy: 'value' }),
    ]).then(([agg, list, div]) => {
      setTotals((agg?.rows || [])[0] || {});
      setPublished(list.items || []);
      setDiversity(div?.rows || []);
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

  const diversityTotal = diversity.reduce((sum, r) => sum + (r.count || 0), 0) || 1;
  const chartData = published.map((e) => ({ name: `#${e.episode_number}`, views: e.views || 0 }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl text-foreground">אנליטיקה</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          ביצועי הפרקים שפורסמו ופיזור סוגי התוכן, כדי לתכנן את הפרקים הבאים.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Eye} label="צפיות" value={num(totals.sum_views)} tone="#03A9F4" />
        <StatCard icon={Clock} label="שעות צפייה" value={num(totals.sum_watch_time_hours)} tone="#0288D1" />
        <StatCard icon={Users} label="נרשמים חדשים" value={num(totals.sum_subscribers_gained)} tone="#E91E63" />
        <StatCard icon={ThumbsUp} label="לייקים" value={num(totals.sum_likes)} tone="#FFC107" />
      </div>

      <div className="rounded-3xl border border-border bg-card p-5">
        <h2 className="font-heading text-sm text-foreground">צפיות לפי פרק</h2>
        {chartData.length ? (
          <div className="mt-4 h-64 w-full" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Bar dataKey="views" fill="#03A9F4" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">אין עדיין פרקים שפורסמו.</p>
        )}
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="rounded-3xl border border-border bg-card p-5 lg:col-span-2">
          <h2 className="font-heading text-sm text-foreground">ביצועי פרקים</h2>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-muted-foreground">
                  <th className="p-2 text-start font-medium">פרק</th>
                  <th className="p-2 text-start font-medium">צפיות</th>
                  <th className="p-2 text-start font-medium">זמן צפייה</th>
                  <th className="p-2 text-start font-medium">ריטנשן</th>
                  <th className="p-2 text-start font-medium">CTR</th>
                  <th className="p-2 text-start font-medium">נרשמים</th>
                  <th className="p-2 text-start font-medium">פורסם</th>
                </tr>
              </thead>
              <tbody>
                {published.map((e) => (
                  <tr key={e.id} className="border-t border-border">
                    <td className="max-w-56 truncate p-2 text-foreground/85">{e.title}</td>
                    <td className="p-2 text-foreground/80">{num(e.views)}</td>
                    <td className="p-2 text-foreground/80">{e.avg_view_duration || '—'}</td>
                    <td className="p-2 text-foreground/80">{e.retention ? `${e.retention}%` : '—'}</td>
                    <td className="p-2 text-foreground/80">{e.ctr ? `${e.ctr}%` : '—'}</td>
                    <td className="p-2 text-foreground/80">{e.subscribers_gained ? `+${e.subscribers_gained}` : '—'}</td>
                    <td className="p-2 text-muted-foreground">{shortDate(e.published_at)}</td>
                  </tr>
                ))}
                {!published.length && (
                  <tr>
                    <td colSpan={7} className="p-4 text-center text-muted-foreground">
                      אין עדיין נתונים.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-3xl border border-border bg-card p-5">
          <h2 className="flex items-center gap-2 font-heading text-sm text-foreground">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            גיוון תוכן
          </h2>
          <ul className="mt-3 space-y-2">
            {diversity.map((row) => {
              const percent = Math.round(((row.count || 0) / diversityTotal) * 100);
              return (
                <li key={row.value || 'unknown'}>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-foreground/75">{row.value || 'ללא ערך'}</span>
                    <span className="text-muted-foreground">{percent}%</span>
                  </div>
                  <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-brand-pink" style={{ width: `${percent}%` }} />
                  </div>
                </li>
              );
            })}
            {!diversity.length && <li className="text-sm text-muted-foreground">אין נתונים.</li>}
          </ul>
        </div>
      </div>
    </div>
  );
}