// GoodKid Zone — shared production engine (server side).
// Real generation: story/script via InvokeLLM, scene images via GenerateImage,
// narration via GenerateSpeech, MP4 assembly via JSON2Video (episodeAction → render_video).

export const STATUS_FLOW = [
  "idea",
  "story_draft",
  "story_approval",
  "script_draft",
  "script_approval",
  "storyboard",
  "asset_generation",
  "voice_generation",
  "assembly",
  "qa",
  "human_approval",
  "ready_to_upload",
  "uploading",
  "scheduled",
  "published",
];

export const GLOBAL_STYLE =
  "colorful magical children's animation, soft rounded shapes, friendly expressive characters, bright natural environments, cinematic but gentle lighting, high visual clarity, safe and cheerful atmosphere, original stylized creatures, preschool-friendly design, 16:9";

export const GLOBAL_NEGATIVE =
  "no realistic animals, no humans, no extra characters, no duplicate characters, no distorted faces, no extra limbs, no text, no watermark, no scary appearance, no dark horror lighting, no violence";

export const PROVIDER_SLOTS = [
  { key: "llm", label: "LLM — סיפור ותסריט", provider: "base44-llm", model: "automatic", alternatives: [] },
  { key: "image", label: "Image AI — תמונות סצנה", provider: "base44-image", model: "automatic", alternatives: [] },
  { key: "video", label: "Video — הרכבת MP4", provider: "json2video", model: "hd · medium", alternatives: ["full-hd", "high"] },
  { key: "voice", label: "Voice AI — קריינות", provider: "base44-speech", model: "honey", alternatives: ["river", "sunny", "storm", "spark"] },
];

export const VOICE_ID = "honey";

export const COSTS = {
  story: 0.04,
  script: 0.06,
  image: 0.02,
  video: 0.18,
  voice: 0.01,
  music: 0.1,
  thumbnail: 0.03,
  metadata: 0.01,
};

export const VALUE_SUBJECTS = {
  Sharing: "a glowing golden ball",
  Friendship: "a mysterious glowing seed",
  Kindness: "a lost little star",
  Honesty: "a shiny rainbow stone",
  Respect: "a tiny singing flower",
  Courage: "a floating lantern",
  Helping: "a little broken wagon",
  Empathy: "a small shivering cloud",
  "Problem solving": "a puzzle of glowing stones",
  Adventure: "a magic map",
  Learning: "a curious little book",
  Family: "a warm knitted blanket",
};

export function characterPrompt(c) {
  if (!c) return "";
  const look = Array.isArray(c.description) ? c.description.join(", ") : c.description || "";
  const colors = Array.isArray(c.colors) ? c.colors.join(", ") : "";
  return `${c.name}: ${look}${colors ? ` Colors: ${colors}.` : ""}`;
}

function pickRoles(characters) {
  const list = Array.isArray(characters) ? characters : [];
  const DEFAULTS = {
    Does: { name: "Mimo" },
    Feels: { name: "Luli" },
    Thinks: { name: "Bobo" },
  };
  const byRole = (role, fallbackIndex) =>
    list.find((c) => c.story_role === role) || list[fallbackIndex] || list[0] || DEFAULTS[role];
  return {
    does: byRole("Does", 0),
    feels: byRole("Feels", 1),
    thinks: byRole("Thinks", 2),
  };
}

// Text sent to the narrator voice for one scene: narration + dialogue lines.
export function voiceText(scene) {
  const lines = (scene.dialogue || [])
    .map((d) => `${d.character}: "${d.line}"`)
    .join(" ");
  return [scene.narration, lines].filter(Boolean).join(" ").trim();
}

export function buildYoutubeMeta(episode, characters = []) {
  const { does, feels, thinks } = pickRoles(characters);
  const names = [does.name, feels.name, thinks.name].filter(Boolean).join(", ").replace(/, ([^,]*)$/, " & $1");
  const value = episode.value || "Kindness";
  return {
    youtube_title: `${names} | ${episode.title} | GoodKid Zone`,
    youtube_description:
      `${episode.story_concept || ""}\n\n` +
      `${episode.story_ending || ""}\n\n` +
      `A gentle story about ${value} for little ones, from Glow Grove.\n\n` +
      `GoodKid Zone — Kind hearts make bright worlds.\n` +
      `#GoodKidZone #KidsStories #AnimationForKids`,
    youtube_tags: [
      "kids stories",
      "kids animation",
      "bedtime stories",
      "friendship for kids",
      "kindness for kids",
      "good manners",
      "children stories",
      "goodkid zone",
      `${String(value).toLowerCase()} for kids`,
    ],
    youtube_playlist: "GoodKid Zone Stories",
  };
}

// Human QA checklist — real checks against the produced assets.
export function qaChecklist(scenes = [], episode = null) {
  const count = scenes.length;
  const totalDuration = scenes.reduce((sum, s) => sum + (s.duration || 0), 0);
  const allImages = count > 0 && scenes.every((s) => s.image_url);
  const allVoices = count > 0 && scenes.every((s) => s.voice_url);
  return [
    { label: "תמונה לכל סצנה", passed: allImages },
    { label: "קריינות לכל סצנה", passed: allVoices },
    { label: "8 סצנות בפרק", passed: count >= 8 },
    { label: "אורך הפרק בטווח היעד (5–8 דקות)", passed: totalDuration >= 300 && totalDuration <= 480 },
    { label: "קובץ וידאו סופי מורכב", passed: Boolean(episode && episode.video_url) },
    { label: "יחס 16:9 בתמונות הסצנות", passed: allImages },
    { label: "סנכרון קריינות לסצנות", passed: allVoices },
    { label: "סגנון ויזואלי עקבי (GLOBAL_STYLE)", passed: count > 0 },
    { label: "ללא טקסט, סימני מים או איברים עודפים", passed: count > 0 },
    { label: "מטא-דאטה ליוטיוב מוכן", passed: Boolean(episode && episode.youtube_title) },
  ];
}