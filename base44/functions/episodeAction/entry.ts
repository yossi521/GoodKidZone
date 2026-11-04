import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { secrets } from 'base44:runtime';
import {
  GLOBAL_STYLE,
  GLOBAL_NEGATIVE,
  VALUE_SUBJECTS,
  VOICE_ID,
  characterPrompt,
  voiceText,
  buildYoutubeMeta,
  qaChecklist,
  COSTS,
  PROVIDER_SLOTS,
} from '../../shared/goodkid.ts';

const PROVIDER_NAMES = Object.fromEntries(PROVIDER_SLOTS.map((p) => [p.key, p]));

// list/filter with an options object returns a page ({items}), not an array.
const asArray = (result) => (Array.isArray(result) ? result : (result && result.items) || []);

function providerFor(type) {
  if (type === 'story' || type === 'script' || type === 'metadata') return PROVIDER_NAMES.llm;
  if (type === 'image') return PROVIDER_NAMES.image;
  if (type === 'video') return PROVIDER_NAMES.video;
  if (type === 'voice') return PROVIDER_NAMES.voice;
  return PROVIDER_NAMES.llm;
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const core = base44.asServiceRole.integrations.Core;

    const body = await req.json().catch(() => ({}));
    const { action, episodeId, sceneId } = body || {};
    if (!action || !episodeId) return Response.json({ error: 'Missing action or episodeId' }, { status: 400 });

    const episode = await base44.entities.Episode.get(episodeId);
    if (!episode) return Response.json({ error: 'Episode not found' }, { status: 404 });

    const actor = user.full_name || user.email || 'Admin';
    const now = new Date().toISOString();
    const log = (act, details, result = 'ok') =>
      base44.entities.ActivityLog.create({
        episode_id: episode.id,
        episode_title: episode.title,
        actor,
        action: act,
        details,
        result,
      });

    const charList = asArray(await base44.entities.Character.list());
    const locList = asArray(await base44.entities.Location.list('order', 100).catch(() => []));

    const episodeCharacters = charList.filter((c) =>
      (episode.character_slugs || []).includes(c.slug),
    );
    const locations = locList.length ? locList : [];
    const locationName = episode.location || (locations[0] && locations[0].name) || 'Glow Grove';

    const genRecord = (type, label, prompt, extra = {}) => {
      const p = providerFor(type);
      return {
        episode_id: episode.id,
        generation_type: type,
        provider: p ? p.provider : 'base44',
        model: p ? p.model : 'automatic',
        label,
        prompt: prompt || '',
        credits_used: 1,
        estimated_cost: COSTS[type] || 0,
        status: 'completed',
        attempt: 1,
        completed_at: now,
        ...extra,
      };
    };

    const charLines = episodeCharacters
      .map((c) => {
        const look = Array.isArray(c.description) ? c.description.join(', ') : c.description || '';
        const personality = Array.isArray(c.personality) ? c.personality.join(', ') : c.personality || '';
        return `${c.name} — look: ${look}${personality ? `; personality: ${personality}` : ''}${c.weakness ? `; weakness: ${c.weakness}` : ''}`;
      })
      .join('\n');
    const charPrompts = episodeCharacters.map(characterPrompt).filter(Boolean).join(' ');
    const charNegatives = episodeCharacters.map((c) => c.negative_prompt).filter(Boolean).join(', ');

    // ---------- STORY ----------
    if (action === 'generate_story') {
      const prompt =
        `You write stories for "GoodKid Zone", a YouTube channel of gentle animated episodes for children aged 3-6. ` +
        `Warm, simple English. No scary content, no violence, always a positive resolution.\n` +
        `Episode title: ${episode.title}\n` +
        `Value focus: ${episode.value || 'Kindness'} (a small magical object linked to it: ${VALUE_SUBJECTS[episode.value] || 'a small magical object'})\n` +
        `Setting: ${locationName}\n` +
        `Characters to use (only these):\n${charLines}\n\n` +
        `Write the story for one episode of about 6 minutes. ` +
        `Return story_concept (1-2 sentences), story_conflict, story_arc, story_ending, moral, values (array with the main value).`;
      const story = await core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: 'object',
          properties: {
            story_concept: { type: 'string' },
            story_conflict: { type: 'string' },
            story_arc: { type: 'string' },
            story_ending: { type: 'string' },
            moral: { type: 'string' },
            values: { type: 'array', items: { type: 'string' } },
          },
          required: ['story_concept', 'story_conflict', 'story_arc', 'story_ending', 'moral', 'values'],
        },
      });
      const updated = await base44.entities.Episode.update(episode.id, {
        story_concept: story.story_concept,
        story_conflict: story.story_conflict,
        story_arc: story.story_arc,
        story_ending: story.story_ending,
        moral: story.moral,
        values: story.values || [episode.value],
        status: 'story_draft',
      });
      await base44.entities.Generation.create(
        genRecord('story', `סיפור לפרק ${episode.title}`, story.story_concept),
      );
      await log('יצירת סיפור (AI)', story.story_concept);
      return Response.json({ ok: true, episode: updated });
    }

    if (action === 'approve_story') {
      const updated = await base44.entities.Episode.update(episode.id, { status: 'story_approval' });
      await log('אישור סיפור', 'הסיפור אושר');
      return Response.json({ ok: true, episode: updated });
    }

    // ---------- SCRIPT & SCENES ----------
    if (action === 'generate_script') {
      // Target duration from the episode (e.g. "59 שניות" or "6 דקות"), default 6 minutes.
      const targetRaw = String(episode.duration_target || '');
      const targetNum = parseFloat(targetRaw);
      const targetSeconds = targetNum && !isNaN(targetNum) ? (/שנ/.test(targetRaw) ? targetNum : targetNum * 60) : 360;
      const sceneCount = Math.min(8, Math.max(1, Math.round(targetSeconds / 40)));
      const perScene = Math.round(targetSeconds / sceneCount);
      const prompt =
        `You write screenplays for "GoodKid Zone", a YouTube channel of gentle animated episodes for children aged 3-6. ` +
        `Simple English, no scary content.\n` +
        `Episode title: ${episode.title}\n` +
        `Approved story:\n` +
        `Concept: ${episode.story_concept || ''}\nConflict: ${episode.story_conflict || ''}\n` +
        `Arc: ${episode.story_arc || ''}\nEnding: ${episode.story_ending || ''}\nMoral: ${episode.moral || ''}\n` +
        `Setting: ${locationName}\n` +
        `Characters:\n${charLines}\n\n` +
        `Create EXACTLY ${sceneCount} scenes. Total duration must be about ${targetSeconds} seconds (each scene about ${perScene} seconds, 10-70 seconds each).\n` +
        `Return scenes: scene_number (1-${sceneCount}), duration (integer seconds), location (the setting name), characters (array of character names present), ` +
        `action (visual action description, 1-2 sentences), narration (one narrator sentence in simple English), ` +
        `dialogue (0-3 lines of {character, line} — use the exact character names), emotion, camera, sfx, music, ` +
        `visual_description (a rich image-generation prompt: which characters appear, their look and colors, pose, background; no text in the image).`;
      const script = await core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: 'object',
          properties: {
            scenes: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  scene_number: { type: 'number' },
                  duration: { type: 'number' },
                  location: { type: 'string' },
                  characters: { type: 'array', items: { type: 'string' } },
                  action: { type: 'string' },
                  narration: { type: 'string' },
                  dialogue: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: { character: { type: 'string' }, line: { type: 'string' } },
                      required: ['character', 'line'],
                    },
                  },
                  emotion: { type: 'string' },
                  camera: { type: 'string' },
                  sfx: { type: 'string' },
                  music: { type: 'string' },
                  visual_description: { type: 'string' },
                },
                required: ['scene_number', 'duration', 'location', 'characters', 'action', 'narration', 'dialogue', 'emotion', 'camera', 'sfx', 'music', 'visual_description'],
              },
            },
          },
          required: ['scenes'],
        },
      });
      const llmScenes = (script.scenes || []).slice(0, sceneCount).sort((a, b) => (a.scene_number || 0) - (b.scene_number || 0));
      if (!llmScenes.length) throw new Error('ה-AI לא החזיר סצנות — נסו שוב');

      await base44.entities.Scene.deleteMany({ episode_id: episode.id });
      const sceneData = llmScenes.map((s, idx) => ({
        scene_number: idx + 1,
        duration: Math.max(10, Math.round(s.duration || 35)),
        location: s.location || locationName,
        characters: s.characters || [],
        action: s.action || '',
        narration: s.narration || '',
        dialogue: s.dialogue || [],
        emotion: s.emotion || '',
        camera: s.camera || '',
        sfx: s.sfx || '',
        music: s.music || '',
        visual_prompt: `${GLOBAL_STYLE}. Scene: ${s.visual_description || s.action}. Characters: ${charPrompts}. No text, no watermark.`,
        negative_prompt: [GLOBAL_NEGATIVE, charNegatives].filter(Boolean).join(', '),
        status: 'draft',
        asset_version: 0,
      }));
      const scenes = await base44.entities.Scene.bulkCreate(sceneData.map((s) => ({ ...s, episode_id: episode.id })));
      const totalDuration = sceneData.reduce((sum, s) => sum + s.duration, 0);
      const updated = await base44.entities.Episode.update(episode.id, {
        status: 'script_draft',
        duration_target: `${Math.round(totalDuration / 60)} דקות`,
        video_url: '',
        render_project: '',
      });
      await base44.entities.Generation.create(
        genRecord('script', `תסריט לפרק ${episode.title}`, `${sceneData.length} סצנות, ${totalDuration} שניות`),
      );
      await log('יצירת תסריט (AI)', `נוצרו ${sceneData.length} סצנות · ${totalDuration} שניות`);
      return Response.json({ ok: true, episode: updated, sceneCount: scenes.length });
    }

    if (action === 'approve_script') {
      const updated = await base44.entities.Episode.update(episode.id, { status: 'script_approval' });
      await log('אישור תסריט', 'התסריט אושר');
      return Response.json({ ok: true, episode: updated });
    }

    // ---------- ASSETS (real AI: image + voice per scene) ----------
    if (action === 'produce_assets') {
      const scenes = asArray(await base44.entities.Scene.filter({ episode_id: episode.id }, { sort: 'scene_number', limit: 200 }));
      if (!scenes.length) return Response.json({ error: 'No scenes to produce' }, { status: 400 });
      await base44.entities.Episode.update(episode.id, { status: 'asset_generation' });

      const produced = [];
      const failed = [];
      for (let i = 0; i < scenes.length; i += 4) {
        const batch = scenes.slice(i, i + 4);
        const settled = await Promise.allSettled(
          batch.map(async (scene) => {
            const [img, snd] = await Promise.all([
              core.GenerateImage({ prompt: scene.visual_prompt }),
              core.GenerateSpeech({ text: voiceText(scene), voice: VOICE_ID, language_code: 'en' }),
            ]);
            return { scene, imageUrl: img && img.url, voiceUrl: snd && snd.url };
          }),
        );
        settled.forEach((r, j) => {
          const scene = batch[j];
          if (r.status === 'fulfilled' && r.value.imageUrl && r.value.voiceUrl) produced.push(r.value);
          else {
            const reason = r.status === 'rejected' ? (r.reason && r.reason.message) || 'נכשל' : 'הספק לא החזיר קובץ';
            failed.push({ scene, reason });
          }
        });
      }

      const updates = produced.map(({ scene, imageUrl, voiceUrl }) => ({
        id: scene.id,
        image_url: imageUrl,
        voice_url: voiceUrl,
        status: 'voice_ready',
        asset_version: (scene.asset_version || 0) + 1,
      }));
      if (updates.length) await base44.entities.Scene.bulkUpdate(updates);
      for (const f of failed) {
        await base44.entities.Scene.update(f.scene.id, { status: 'failed', qa_notes: f.reason });
      }

      const records = [];
      for (const { scene } of produced) {
        records.push(genRecord('image', `תמונת סצנה ${scene.scene_number}`, scene.visual_prompt, { scene_id: scene.id }));
        records.push(genRecord('voice', `קריינות סצנה ${scene.scene_number}`, voiceText(scene), { scene_id: scene.id }));
      }
      records.push(genRecord('metadata', 'מטא-דאטה ליוטיוב', 'buildYoutubeMeta'));
      const created = await base44.entities.Generation.bulkCreate(records);
      const addedCost = created.reduce((sum, g) => sum + (g.estimated_cost || 0), 0);
      const totalCost = Number(((episode.total_cost || 0) + addedCost).toFixed(2));

      if (episode.budget_max && totalCost > episode.budget_max) {
        await base44.entities.Episode.update(episode.id, { status: 'failed', total_cost: totalCost });
        await log('עצירת תקציב', `העלות ${totalCost}$ עברה את התקציב ${episode.budget_max}$`, 'paused');
        return Response.json({ ok: true, episode: await base44.entities.Episode.get(episode.id), budgetPaused: true });
      }

      const meta = buildYoutubeMeta(episode, episodeCharacters);
      const freshScenes = asArray(await base44.entities.Scene.filter({ episode_id: episode.id }, { sort: 'scene_number', limit: 200 }));
      const qa = qaChecklist(freshScenes, { ...episode, ...meta });
      const updated = await base44.entities.Episode.update(episode.id, {
        status: 'assembly',
        total_cost: totalCost,
        ...meta,
        cover_color: episode.cover_color || (episodeCharacters[0] && episodeCharacters[0].accent_color) || '',
      });
      await log(
        'הפקת נכסים (AI)',
        `${produced.length}/${scenes.length} סצנות עם תמונה וקריינות · בקרת איכות: ${qa.filter((q) => q.passed).length}/${qa.length}`,
      );
      return Response.json({ ok: true, episode: updated, qa });
    }

    // ---------- RENDER (JSON2Video) ----------
    if (action === 'render_video') {
      const scenes = asArray(await base44.entities.Scene.filter({ episode_id: episode.id }, { sort: 'scene_number', limit: 200 }));
      const missing = scenes.filter((s) => !s.image_url || !s.voice_url);
      if (!scenes.length || missing.length) {
        return Response.json({ error: 'יש להפיק תמונה וקריינות לכל הסצנות לפני ההרכבה' }, { status: 400 });
      }

      const apiKey = secrets.get('JSON2VIDEO_API_KEY');
      if (!apiKey) return Response.json({ error: 'חסר מפתח JSON2VIDEO_API_KEY בהגדרות המערכת' }, { status: 400 });

      const pollStatus = async (project) => {
        const res = await fetch(`https://api.json2video.com/v2/movies?project=${project}&format=simple`, {
          headers: { 'x-api-key': apiKey },
          signal: AbortSignal.timeout(20000),
        });
        const data = await res.json();
        return data.movie;
      };

      let project = episode.render_project || '';
      if (!project) {
        const movie = {
          resolution: 'hd',
          quality: 'medium',
          thumbnail: 3,
          comment: `GoodKid Zone — ${episode.title}`,
          scenes: scenes.map((s) => ({
            comment: `Scene ${s.scene_number}`,
            duration: s.duration,
            transition: { type: 'xfade', style: 'fade', duration: 1 },
            elements: [
              { type: 'image', src: s.image_url, duration: s.duration, 'fade-in': 1 },
              { type: 'audio', src: s.voice_url, volume: 1 },
            ],
          })),
        };
        const res = await fetch('https://api.json2video.com/v2/movies', {
          method: 'POST',
          headers: { 'x-api-key': apiKey, 'Content-Type': 'application/json' },
          body: JSON.stringify(movie),
          signal: AbortSignal.timeout(30000),
        });
        const data = await res.json();
        if (!data.success || !data.project) {
          throw new Error((data && data.message) || 'JSON2Video: ההזמנה נכשלה');
        }
        project = data.project;
        await base44.entities.Episode.update(episode.id, { render_project: project, status: 'assembly' });
      }

      let movie = null;
      for (let i = 0; i < 12; i++) {
        await new Promise((r) => setTimeout(r, 10000));
        movie = await pollStatus(project);
        if (movie && ['done', 'error', 'timeout'].includes(movie.status)) break;
      }

      if (movie && movie.status === 'done' && movie.url) {
        const updated = await base44.entities.Episode.update(episode.id, {
          video_url: movie.url,
          thumbnail_url: movie.thumbnail || episode.thumbnail_url || '',
          status: 'qa',
        });
        await base44.entities.Generation.create(
          genRecord('video', 'הרכבת וידאו לפרק', project, { external_job_id: project }),
        );
        await log('הרכבת וידאו (JSON2Video)', `נוצר קובץ MP4 · ${movie.duration ? `${Math.round(movie.duration)} שניות` : ''}`);
        return Response.json({ ok: true, episode: updated, video_url: movie.url });
      }
      if (movie && (movie.status === 'error' || movie.status === 'timeout')) {
        await log('הרכבת וידאו', movie.message || 'ההרכבה נכשלה', 'failed');
        return Response.json({ error: `ההרכבה נכשלה: ${movie.message || 'שגיאה'}` }, { status: 500 });
      }
      return Response.json({
        ok: true,
        pending: true,
        episode: { ...episode, render_project: project, status: 'assembly' },
      });
    }

    if (action === 'run_qa') {
      const scenes = asArray(await base44.entities.Scene.filter({ episode_id: episode.id }, { sort: 'scene_number', limit: 200 }));
      const qa = qaChecklist(scenes, episode);
      await log('בקרת איכות', `${qa.filter((q) => q.passed).length}/${qa.length} בדיקות עברו`);
      return Response.json({ ok: true, qa });
    }

    // ---------- REGENERATE ONE SCENE ----------
    if (action === 'regenerate_scene') {
      if (!sceneId) return Response.json({ error: 'Missing sceneId' }, { status: 400 });
      const scene = await base44.entities.Scene.get(sceneId);
      const nextVersion = (scene.asset_version || 1) + 1;
      const [img, snd] = await Promise.all([
        core.GenerateImage({ prompt: scene.visual_prompt }),
        core.GenerateSpeech({ text: voiceText(scene), voice: VOICE_ID, language_code: 'en' }),
      ]);
      if (!img || !img.url || !snd || !snd.url) throw new Error('יצירת הנכסים מחדש נכשלה — נסו שוב');
      await base44.entities.Scene.update(sceneId, {
        image_url: img.url,
        voice_url: snd.url,
        status: 'voice_ready',
        asset_version: nextVersion,
        qa_notes: '',
      });
      const totalCost = Number(((episode.total_cost || 0) + COSTS.image + COSTS.voice).toFixed(2));
      await base44.entities.Episode.update(episode.id, {
        total_cost: totalCost,
        video_url: episode.video_url ? '' : undefined,
        render_project: episode.render_project ? '' : undefined,
      });
      await log('יצירת סצנה מחדש (AI)', `סצנה ${scene.scene_number} → גרסה v${nextVersion}`);
      return Response.json({ ok: true, sceneId, version: nextVersion });
    }

    // ---------- APPROVAL ----------
    if (action === 'approve_episode') {
      const updated = await base44.entities.Episode.update(episode.id, {
        status: 'ready_to_upload',
        approved_at: now,
      });
      await log('אישור פרק', 'הפרק אושר להעלאה');
      return Response.json({ ok: true, episode: updated });
    }

    if (action === 'send_back') {
      const updated = await base44.entities.Episode.update(episode.id, { status: 'script_approval' });
      await log('החזרה לתיקון', 'הפרק הוחזר לשלב התסריט');
      return Response.json({ ok: true, episode: updated });
    }

    return Response.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}