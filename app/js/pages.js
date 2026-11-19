// Static pages: roadmap, missable list, next-up planner and sources.
import { isEarned, toggleEarned } from './store.js';
import { planNextUp, planReason, stageProgress } from './planner.js';
import { spoilerHides } from './tracker.js';

export function renderRoadmap(doc, roadmap, state) {
  const factsEl = document.getElementById('roadmapFacts');
  factsEl.replaceChildren();
  for (const f of roadmap.facts) {
    const d = document.createElement('div');
    d.className = 'fact';
    const b = document.createElement('b');
    b.textContent = f.label;
    const s = document.createElement('span');
    s.textContent = f.value;
    d.append(b, s);
    factsEl.append(d);
  }
  document.getElementById('roadmapIntro').textContent = roadmap.intro;
  const stagesEl = document.getElementById('roadmapStages');
  stagesEl.replaceChildren();
  for (const stage of roadmap.stages) {
    const li = document.createElement('li');
    li.className = 'stage';
    const head = document.createElement('div');
    head.className = 'stage-head';
    const h = document.createElement('h2');
    h.textContent = stage.title;
    const hours = document.createElement('span');
    hours.className = 'hours';
    hours.textContent = stage.hours;
    head.append(h, hours);
    li.append(head);
    const prog = stageProgress(state, doc.trophies, stage.n);
    const p = document.createElement('p');
    p.className = 'stage-progress';
    p.textContent = prog.done + ' of ' + prog.total + ' trophies earned in this stage';
    li.append(p);
    const text = document.createElement('p');
    text.textContent = stage.text;
    li.append(text);
    const tips = document.createElement('ul');
    for (const tip of stage.tips) {
      const t = document.createElement('li');
      t.textContent = tip;
      tips.append(t);
    }
    li.append(tips);
    const pills = document.createElement('div');
    pills.className = 'stage-trophies';
    for (const id of stage.trophyIds) {
      const t = doc.trophies.find((x) => x.id === id);
      if (!t) continue;
      const pill = document.createElement('span');
      pill.className = 'pill' + (isEarned(state, t) ? ' done' : '');
      pill.textContent = spoilerHides(state, t) ? 'Hidden story trophy' : t.name;
      pills.append(pill);
    }
    li.append(pills);
    stagesEl.append(li);
  }
}

export function renderMissable(doc, state, onSelect) {
  const list = document.getElementById('missableList');
  list.replaceChildren();
  const ul = document.createElement('ul');
  ul.className = 'trophy-list';
  for (const t of doc.trophies.filter((x) => x.missable)) {
    const li = document.createElement('li');
    li.className = 'trophy';
    const box = document.createElement('input');
    box.type = 'checkbox';
    box.checked = isEarned(state, t);
    box.setAttribute('aria-label', 'Mark ' + t.name + ' earned');
    box.addEventListener('change', (event) => {
      event.stopPropagation();
      toggleEarned(state, t);
      onSelect(t.name, true);
    });
    const body = document.createElement('div');
    const name = document.createElement('div');
    name.className = 't-name';
    name.textContent = t.name + ' — the one to watch';
    const desc = document.createElement('div');
    desc.className = 't-desc';
    desc.textContent = t.description + ' ' + t.guide;
    body.append(name, desc);
    li.append(box, body, document.createElement('div'));
    li.addEventListener('click', () => onSelect(t.name, false));
    ul.append(li);
  }
  list.append(ul);
  document.getElementById('missableCount').textContent = String(doc.trophies.filter((x) => x.missable).length);
}

export function renderNextUp(doc, state, onSelect) {
  const list = document.getElementById('nextUpList');
  list.replaceChildren();
  const picks = planNextUp(state, doc.trophies);
  document.getElementById('nextUpDone').hidden = picks.length !== 0;
  for (const t of picks) {
    const li = document.createElement('li');
    const name = document.createElement('h2');
    name.textContent = spoilerHides(state, t) ? 'Hidden story trophy' : t.name;
    const why = document.createElement('p');
    why.className = 'why';
    why.textContent = planReason(t, state);
    const guide = document.createElement('p');
    guide.textContent = spoilerHides(state, t) ? 'Earn it in the game to reveal its guide.' : t.guide;
    li.append(name, why, guide);
    li.addEventListener('click', () => onSelect(t.name, false));
    li.style.cursor = 'pointer';
    list.append(li);
  }
}

export function renderSources(doc) {
  const list = document.getElementById('sourceList');
  list.replaceChildren();
  for (const s of doc.sources) {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = s.url;
    a.target = '_blank';
    a.rel = 'noopener';
    a.textContent = '[' + s.ref + '] ' + s.name + ' — retrieved ' + s.retrieved;
    const what = document.createElement('span');
    what.className = 'what';
    what.textContent = s.what;
    li.append(a, what);
    list.append(li);
  }
}
