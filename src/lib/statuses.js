// סטטוסים ותוויות בעברית למערכת הפקת הפרקים (צד לקוח)

export const STATUS_ORDER = [
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

export const STATUS_LABELS = {
  idea: "רעיון",
  story_draft: "טיוטת סיפור",
  story_approval: "סיפור מאושר",
  script_draft: "טיוטת תסריט",
  script_approval: "תסריט מאושר",
  storyboard: "סטוריבורד",
  asset_generation: "יצירת נכסים",
  voice_generation: "יצירת קולות",
  assembly: "הרכבת וידאו",
  qa: "בקרת איכות",
  human_approval: "ממתין לאישור",
  ready_to_upload: "מוכן להעלאה",
  uploading: "מעלה ליוטיוב",
  scheduled: "מתוזמן לפרסום",
  published: "פורסם",
  failed: "נכשל",
};

export const STATUS_CLASSES = {
  idea: "bg-muted text-muted-foreground",
  story_draft: "bg-brand-blue/15 text-brand-deep",
  story_approval: "bg-brand-mint text-brand-deep",
  script_draft: "bg-brand-blue/15 text-brand-deep",
  script_approval: "bg-brand-mint text-brand-deep",
  storyboard: "bg-brand-lilac text-brand-deep",
  asset_generation: "bg-brand-lilac text-brand-deep",
  voice_generation: "bg-brand-lilac text-brand-deep",
  assembly: "bg-brand-lilac text-brand-deep",
  qa: "bg-brand-yellow/30 text-foreground",
  human_approval: "bg-brand-yellow/40 text-foreground",
  ready_to_upload: "bg-brand-blue/20 text-brand-deep",
  uploading: "bg-brand-blue/25 text-brand-deep",
  scheduled: "bg-brand-blue/25 text-brand-deep",
  published: "bg-emerald-100 text-emerald-800",
  failed: "bg-destructive/15 text-destructive",
};

export const PIPELINE_STAGES = [
  { key: "story", label: "סיפור", minIndex: 1 },
  { key: "script", label: "תסריט", minIndex: 3 },
  { key: "storyboard", label: "סטוריבורד", minIndex: 5 },
  { key: "visuals", label: "ויזואל", minIndex: 6 },
  { key: "voices", label: "קולות", minIndex: 7 },
  { key: "assembly", label: "הרכבה", minIndex: 8 },
  { key: "qa", label: "בקרת איכות", minIndex: 9 },
  { key: "approval", label: "אישור", minIndex: 10 },
  { key: "publish", label: "פרסום", minIndex: 14 },
];

export const SCENE_STATUS_LABELS = {
  draft: "טיוטה",
  image_ready: "תמונה מוכנה",
  video_ready: "וידאו מוכן",
  voice_ready: "קול מוכן",
  approved: "מאושר",
  failed: "נכשל",
};

export function statusIndex(status) {
  const i = STATUS_ORDER.indexOf(status);
  return i === -1 ? 0 : i;
}

export function stageDone(status, minIndex) {
  if (status === "published") return true;
  return statusIndex(status) >= minIndex;
}