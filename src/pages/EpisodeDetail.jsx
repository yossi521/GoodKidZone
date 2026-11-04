import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowRight, History } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import StatusBadge from '@/components/StatusBadge';
import EpisodePipeline from '@/components/EpisodePipeline';
import StoryPanel from '@/components/episode/StoryPanel';
import ScriptPanel from '@/components/episode/ScriptPanel';
import ProductionPanel from '@/components/episode/ProductionPanel';
import ApprovalPanel from '@/components/episode/ApprovalPanel';
import CostPanel from '@/components/episode/CostPanel';
import { qaChecklist } from '@/lib/episodeQa';
import { dateTime, money } from '@/lib/format';

export default function EpisodeDetail() {
  const { id } = useParams();
  const { toast } = useToast();
  const [episode, setEpisode] = useState(null);
  const [scenes, setScenes] = useState([]);
  const [generations, setGenerations] = useState([]);
  const [costRows, setCostRows] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(null);

  const load = useCallback(async () => {
    const [ep, scenePage, genPage, costAgg, logPage] = await Promise.all([
      base44.entities.Episode.get(id),
      base44.entities.Scene.filter({ episode_id: id }, { sort: 'scene_number', limit: 200 }),
      base44.entities.Generation.filter({ episode_id: id }, { sort: '-created_date', limit: 100 }),
      base44.entities.Generation.aggregate({
        query: { episode_id: id },
        groupBy: 'generation_type',
        sum: ['estimated_cost'],
      }),
      base44.entities.ActivityLog.filter({ episode_id: id }, { sort: '-created_date', limit: 20 }),
    ]);
    setEpisode(ep);
    setScenes(scenePage.items || []);
    setGenerations(genPage.items || []);
    setCostRows(costAgg?.rows || []);
    setLogs(logPage.items || []);
    setLoading(false);
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const run = async (action, extra = {}) => {
    setBusy(action === 'regenerate_scene' ? `scene-${extra.sceneId}` : action);
    try {
      const payload = action === 'publish' ? { episodeId: id, ...extra } : { action, episodeId: id, ...extra };
      const res = await base44.functions.invoke(action === 'publish' ? 'youtubeUpload' : 'episodeAction', payload);
      if (res.data?.error) throw new Error(res.data.error);
      await load();
      toast({ title: 'בוצע', description: 'הפעולה הושלמה.' });
    } catch (e) {
      toast({
        title: 'שגיאה',
        description: e?.response?.data?.error || e.message,
        variant: 'destructive',
      });
    } finally {
      setBusy(null);
    }
  };

  const saveMeta = async (fields) => {
    await base44.entities.Episode.update(id, fields);
    await load();
    toast({ title: 'נשמר', description: 'המטא-דאטה עודכן.' });
  };

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-border border-t-brand-blue" />
      </div>
    );
  }

  if (!episode) {
    return <div className="py-16 text-center text-sm text-muted-foreground">הפרק לא נמצא.</div>;
  }

  const accent = episode.cover_color || '#03A9F4';
  const qa = qaChecklist(scenes, episode);

  const chips = [
    { label: 'ערך', value: episode.value },
    { label: 'מקום', value: episode.location },
    { label: 'אורך', value: episode.duration_target },
    { label: 'סצנות', value: scenes.length },
    { label: 'עלות', value: money(episode.total_cost) },
  ].filter((c) => c.value);

  return (
    <div className="space-y-5">
      <Link to="/episodes" className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-deep hover:underline">
        <ArrowRight className="h-3.5 w-3.5" />
        כל הפרקים
      </Link>

      <div
        className="rounded-3xl border border-border p-5 shadow-sm"
        style={{ background: `linear-gradient(135deg, ${accent}14, ${accent}33)` }}
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-foreground/55">
              פרק #{String(episode.episode_number || 0).padStart(3, '0')}
            </p>
            <h1 className="font-heading text-2xl text-foreground">{episode.title}</h1>
          </div>
          <StatusBadge status={episode.status} />
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {chips.map((c) => (
            <span key={c.label} className="rounded-full bg-card/75 px-3 py-1 text-[11px] text-foreground/70">
              {c.label}: <span className="font-medium text-foreground/90">{c.value}</span>
            </span>
          ))}
        </div>

        <div className="mt-4">
          <EpisodePipeline status={episode.status} />
        </div>
      </div>

      <Tabs defaultValue="story">
        <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1 rounded-2xl bg-muted p-1">
          <TabsTrigger value="story" className="rounded-xl">סיפור</TabsTrigger>
          <TabsTrigger value="script" className="rounded-xl">תסריט וסצנות</TabsTrigger>
          <TabsTrigger value="production" className="rounded-xl">הפקה ובקרה</TabsTrigger>
          <TabsTrigger value="approval" className="rounded-xl">אישור ופרסום</TabsTrigger>
          <TabsTrigger value="cost" className="rounded-xl">עלויות</TabsTrigger>
        </TabsList>

        <TabsContent value="story" className="mt-4">
          <StoryPanel episode={episode} onAction={run} busy={busy} />
        </TabsContent>

        <TabsContent value="script" className="mt-4">
          <ScriptPanel
            episode={episode}
            scenes={scenes}
            accent={accent}
            onAction={run}
            onRegenerate={(sceneId) => run('regenerate_scene', { sceneId })}
            busy={busy}
          />
        </TabsContent>

        <TabsContent value="production" className="mt-4">
          <ProductionPanel
            episode={episode}
            scenes={scenes}
            qa={qa}
            accent={accent}
            onAction={run}
            onRegenerate={(sceneId) => run('regenerate_scene', { sceneId })}
            busy={busy}
          />
        </TabsContent>

        <TabsContent value="approval" className="mt-4">
          <ApprovalPanel
            episode={episode}
            scenes={scenes}
            accent={accent}
            onAction={run}
            onSaveMeta={saveMeta}
            busy={busy}
          />
        </TabsContent>

        <TabsContent value="cost" className="mt-4">
          <CostPanel episode={episode} costRows={costRows} generations={generations} />
        </TabsContent>
      </Tabs>

      <div className="rounded-3xl border border-border bg-card p-4">
        <h3 className="flex items-center gap-2 font-heading text-sm text-foreground">
          <History className="h-4 w-4 text-muted-foreground" />
          יומן פעולות
        </h3>
        <ul className="mt-3 space-y-2">
          {logs.map((log) => (
            <li key={log.id} className="flex flex-wrap items-baseline gap-x-2 text-xs">
              <span className="font-medium text-foreground/80">{log.action}</span>
              <span className="text-muted-foreground">{log.details}</span>
              <span className="text-muted-foreground/70">{dateTime(log.created_date)}</span>
            </li>
          ))}
          {!logs.length && <li className="text-xs text-muted-foreground">אין עדיין פעולות בפרק הזה.</li>}
        </ul>
      </div>
    </div>
  );
}