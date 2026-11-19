// Next-up planner: order what is left by roadmap stage, missable first, quickest wins next.
// A trophy is "quick" when it is bronze, not counted, and in the last roadmap stage.
import { isEarned, countValue } from './store.js';

const GRADE_RANK = { platinum: 4, gold: 3, silver: 2, bronze: 1 };

export function planNextUp(state, trophies) {
  const remaining = trophies.filter((t) => !isEarned(state, t) && t.grade !== 'platinum');
  remaining.sort((a, b) => {
    if (a.missable !== b.missable) return a.missable ? -1 : 1;
    if (a.stage !== b.stage) return a.stage - b.stage;
    const aQuick = a.grade === 'bronze' && !a.count ? 0 : 1;
    const bQuick = b.grade === 'bronze' && !b.count ? 0 : 1;
    if (aQuick !== bQuick) return aQuick - bQuick;
    if (GRADE_RANK[a.grade] !== GRADE_RANK[b.grade]) return GRADE_RANK[a.grade] - GRADE_RANK[b.grade];
    return a.id - b.id;
  });
  return remaining.slice(0, 3);
}

export function planReason(trophy, state) {
  if (trophy.missable) return 'Do this first — it is the one trophy that can be missed.';
  if (trophy.stage === 1) return 'Stage 1 of the roadmap: finish the story while you are here.';
  if (trophy.stage === 2) return 'Stage 2 of the roadmap: a side questline that stays open after the story.';
  if (trophy.stage === 3) return 'Stage 3 of the roadmap: part of the 100% Completion Checklist.';
  if (trophy.stage === 4) return 'Stage 4 of the roadmap: a collectible or money trophy.';
  if (trophy.count) {
    const done = countValue(state, trophy);
    if (done > 0) return 'Stage 5 cleanup — you are already ' + done + ' of ' + trophy.count + ' there.';
  }
  return 'Stage 5 cleanup — a quick win to close out the list.';
}

export function kindProgress(state, trophies) {
  const kinds = ['story', 'collectibles', 'activities'];
  return kinds.map((kind) => {
    const all = trophies.filter((t) => t.kind === kind);
    const done = all.filter((t) => isEarned(state, t)).length;
    return { kind, done, total: all.length };
  });
}

export function stageProgress(state, trophies, stageNumber) {
  const all = trophies.filter((t) => t.stage === stageNumber);
  const done = all.filter((t) => isEarned(state, t)).length;
  return { done, total: all.length };
}
