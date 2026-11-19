// Progress store: everything the tracker remembers lives in localStorage only.
// State shape: { earned: {name: true}, counts: {name: number}, notes: {name: text}, spoiler: bool }
export const STORE_KEY = 'leonida-trophy-atlas-v1';

export function loadProgress() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return { earned: {}, counts: {}, notes: {}, spoiler: false };
    const data = JSON.parse(raw);
    return {
      earned: data.earned && typeof data.earned === 'object' ? data.earned : {},
      counts: data.counts && typeof data.counts === 'object' ? data.counts : {},
      notes: data.notes && typeof data.notes === 'object' ? data.notes : {},
      spoiler: data.spoiler === true,
    };
  } catch {
    return { earned: {}, counts: {}, notes: {}, spoiler: false };
  }
}

export function saveProgress(state) {
  localStorage.setItem(STORE_KEY, JSON.stringify(state));
}

export function isEarned(state, trophy) {
  return state.earned[trophy.name] === true;
}

export function toggleEarned(state, trophy) {
  if (isEarned(state, trophy)) delete state.earned[trophy.name];
  else state.earned[trophy.name] = true;
  saveProgress(state);
}

export function earnedCount(state, trophies) {
  return trophies.filter((t) => isEarned(state, t)).length;
}

export function countValue(state, trophy) {
  const v = state.counts[trophy.name];
  return typeof v === 'number' && v >= 0 ? Math.min(v, trophy.count || 0) : 0;
}

export function setCountValue(state, trophy, value) {
  if (!trophy.count) return;
  const clamped = Math.max(0, Math.min(trophy.count, Math.round(value)));
  if (clamped === 0) delete state.counts[trophy.name];
  else state.counts[trophy.name] = clamped;
  saveProgress(state);
}

export function getNote(state, trophy) {
  return state.notes[trophy.name] || '';
}

export function setNote(state, trophy, text) {
  const trimmed = String(text || '').slice(0, 500);
  if (trimmed === '') delete state.notes[trophy.name];
  else state.notes[trophy.name] = trimmed;
  saveProgress(state);
}

export function exportFile(state) {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'leonida-trophy-progress.json';
  a.click();
  URL.revokeObjectURL(url);
}

export function importFileText(text) {
  const data = JSON.parse(text);
  if (!data || typeof data !== 'object') throw new Error('not an object');
  return {
    earned: data.earned && typeof data.earned === 'object' ? data.earned : {},
    counts: data.counts && typeof data.counts === 'object' ? data.counts : {},
    notes: data.notes && typeof data.notes === 'object' ? data.notes : {},
    spoiler: data.spoiler === true,
  };
}
