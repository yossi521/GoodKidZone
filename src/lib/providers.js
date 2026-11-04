// ספקי ה-AI במערכת — הפקה אמיתית:
// סיפור ותסריט דרך LLM, תמונות דרך מנוע התמונות, קריינות דרך מנוע הדיבור,
// והרכבת קובץ MP4 דרך JSON2Video.
export const PROVIDER_SLOTS = [
  {
    key: 'llm',
    label: 'LLM — סיפור ותסריט',
    provider: 'base44-llm',
    model: 'automatic',
    alternatives: [],
  },
  {
    key: 'image',
    label: 'Image AI — תמונות סצנה',
    provider: 'base44-image',
    model: 'automatic',
    alternatives: [],
  },
  {
    key: 'video',
    label: 'Video — הרכבת MP4',
    provider: 'json2video',
    model: 'hd · medium',
    alternatives: ['full-hd', 'high'],
  },
  {
    key: 'voice',
    label: 'Voice AI — קריינות',
    provider: 'base44-speech',
    model: 'honey',
    alternatives: ['river', 'sunny', 'storm', 'spark'],
  },
];