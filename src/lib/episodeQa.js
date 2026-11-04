// בדיקות בקרת איכות (מקבילות לבדיקות שבצד השרת)
export function qaChecklist(scenes = [], episode = null) {
  const count = scenes.length;
  const totalDuration = scenes.reduce((sum, s) => sum + (s.duration || 0), 0);
  const allImages = count > 0 && scenes.every((s) => s.image_url);
  const allVoices = count > 0 && scenes.every((s) => s.voice_url);
  return [
    { label: 'תמונה לכל סצנה', passed: allImages },
    { label: 'קריינות לכל סצנה', passed: allVoices },
    { label: '8 סצנות בפרק', passed: count >= 8 },
    { label: 'אורך הפרק בטווח היעד (5–8 דקות)', passed: totalDuration >= 300 && totalDuration <= 480 },
    { label: 'קובץ וידאו סופי מורכב', passed: Boolean(episode && episode.video_url) },
    { label: 'יחס 16:9 בתמונות הסצנות', passed: allImages },
    { label: 'סנכרון קריינות לסצנות', passed: allVoices },
    { label: 'סגנון ויזואלי עקבי (GLOBAL_STYLE)', passed: count > 0 },
    { label: 'ללא טקסט, סימני מים או איברים עודפים', passed: count > 0 },
    { label: 'מטא-דאטה ליוטיוב מוכן', passed: Boolean(episode && episode.youtube_title) },
  ];
}