import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { secrets } from 'base44:runtime';

const CHUNK = 8 * 1024 * 1024; // 8 MB per resumable-upload chunk

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { episodeId, visibility = 'private', scheduledAt = '' } = body || {};
    if (!episodeId) return Response.json({ error: 'Missing episodeId' }, { status: 400 });

    const episode = await base44.entities.Episode.get(episodeId);
    if (!episode) return Response.json({ error: 'Episode not found' }, { status: 404 });
    if (!episode.video_url) {
      return Response.json({ error: 'אין קובץ וידאו — הריצו את הרכבת הווידאו קודם' }, { status: 400 });
    }

    const clientId = secrets.get('YOUTUBE_CLIENT_ID');
    const clientSecret = secrets.get('YOUTUBE_CLIENT_SECRET');
    const refreshToken = secrets.get('YOUTUBE_REFRESH_TOKEN');
    if (!clientId || !clientSecret || !refreshToken) {
      return Response.json(
        { error: 'חסרים פרטי YouTube OAuth בהגדרות: Client ID, Client Secret ו-Refresh token' },
        { status: 400 },
      );
    }

    // Exchange the refresh token for an access token.
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
      signal: AbortSignal.timeout(15000),
    });
    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) {
      return Response.json(
        { error: `אימות YouTube נכשל: ${tokenData.error_description || tokenData.error || 'unknown'}` },
        { status: 400 },
      );
    }
    const accessToken = tokenData.access_token;

    await base44.entities.Episode.update(episode.id, { status: 'uploading' });

    const fileRes = await fetch(episode.video_url, { signal: AbortSignal.timeout(120000) });
    if (!fileRes.ok) throw new Error(`הורדת קובץ הווידאו נכשלה (${fileRes.status})`);
    const bytes = new Uint8Array(await fileRes.arrayBuffer());
    const total = bytes.byteLength;

    const publishAt = scheduledAt ? new Date(scheduledAt).toISOString() : undefined;
    const metadata = {
      snippet: {
        title: (episode.youtube_title || episode.title || 'GoodKid Zone').slice(0, 100),
        description: episode.youtube_description || '',
        tags: episode.youtube_tags || [],
        categoryId: '24',
      },
      status: {
        privacyStatus: publishAt ? 'private' : visibility,
        selfDeclaredMadeForKids: true,
        ...(publishAt ? { publishAt } : {}),
      },
    };

    // Initiate a resumable upload session.
    const initRes = await fetch('https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json; charset=UTF-8',
        'X-Upload-Content-Type': 'video/mp4',
        'X-Upload-Content-Length': String(total),
      },
      body: JSON.stringify(metadata),
      signal: AbortSignal.timeout(20000),
    });
    if (!initRes.ok) {
      throw new Error(`פתיחת העלאה ליוטיוב נכשלה (${initRes.status}): ${await initRes.text()}`);
    }
    const sessionUrl = initRes.headers.get('location');
    if (!sessionUrl) throw new Error('YouTube לא החזיר כתובת העלאה');

    let offset = 0;
    let videoId = '';
    for (let attempt = 0; attempt < 3 && !videoId; attempt++) {
      if (attempt > 0) await new Promise((r) => setTimeout(r, 4000 * attempt));
      while (offset < total) {
        const end = Math.min(offset + CHUNK, total);
        const chunk = bytes.subarray(offset, end);
        const putRes = await fetch(sessionUrl, {
          method: 'PUT',
          headers: {
            'Content-Length': String(end - offset),
            'Content-Range': `bytes ${offset}-${end - 1}/${total}`,
          },
          body: chunk,
          signal: AbortSignal.timeout(120000),
        });
        if (putRes.status === 308) {
          offset = end;
          continue;
        }
        if (putRes.status === 200 || putRes.status === 201) {
          const done = await putRes.json();
          videoId = done.id;
          break;
        }
        if (putRes.status === 500 || putRes.status === 503) break; // retry from last offset
        throw new Error(`העלאת הווידאו נכשלה (${putRes.status}): ${await putRes.text()}`);
      }
    }
    if (!videoId) throw new Error('העלאת הווידאו נכשלה אחרי מספר ניסיונות');

    const now = new Date().toISOString();
    const updated = await base44.entities.Episode.update(episode.id, {
      status: publishAt ? 'scheduled' : 'published',
      youtube_visibility: visibility,
      scheduled_at: publishAt || '',
      youtube_video_id: videoId,
      published_at: publishAt ? '' : now,
    });
    await base44.entities.ActivityLog.create({
      episode_id: episode.id,
      episode_title: episode.title,
      actor: user.full_name || user.email || 'Admin',
      action: publishAt ? 'תזמון פרסום ליוטיוב' : 'העלאה אמיתית ליוטיוב',
      details: `YouTube video ID: ${videoId}`,
      result: 'ok',
    });
    return Response.json({
      ok: true,
      episode: updated,
      youtube_video_id: videoId,
      url: `https://youtu.be/${videoId}`,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}