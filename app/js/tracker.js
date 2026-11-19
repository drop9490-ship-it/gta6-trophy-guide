// Tracker view: the trophy checklist and the guide detail pane.
import { isEarned, toggleEarned, countValue, setCountValue, getNote, setNote } from './store.js';
import { planReason } from './planner.js';

const KIND_LABELS = { story: 'Story', collectibles: 'Collectible', activities: 'Activity' };

export function spoilerHides(state, trophy) {
  return state.spoiler && trophy.hidden && !isEarned(state, trophy);
}

function formatCount(trophy) {
  if (!trophy.count) return '';
  if (trophy.countUnit === 'dollars laundered') return '$' + trophy.count.toLocaleString('en-US') + ' to launder';
  if (trophy.countUnit === 'dollars spent') return '$' + trophy.count.toLocaleString('en-US') + ' to spend';
  return trophy.count + ' ' + trophy.countUnit;
}

export function filterTrophies(trophies, filters, state) {
  return trophies.filter((t) => {
    if (filters.kind === 'missable' && !t.missable) return false;
    if (filters.kind === 'online') return false;
    if (filters.kind !== 'all' && filters.kind !== 'missable' && t.kind !== filters.kind) return false;
    if (filters.grade !== 'all' && t.grade !== filters.grade) return false;
    if (filters.earnedOnly && !isEarned(state, t)) return false;
    if (filters.query) {
      const q = filters.query.toLowerCase();
      const hay = (t.name + ' ' + t.description + ' ' + t.guide).toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

export function renderTrophyList(listEl, metaEl, emptyEl, trophies, filters, state, selectedName, onSelect) {
  const shown = filterTrophies(trophies, filters, state);
  listEl.replaceChildren();
  emptyEl.hidden = shown.length !== 0;
  const earned = trophies.filter((t) => isEarned(state, t)).length;
  metaEl.textContent = 'Showing ' + shown.length + ' of 55 trophies · ' + earned + ' earned';
  for (const t of shown) {
    const li = document.createElement('li');
    li.className = 'trophy' + (isEarned(state, t) ? ' earned' : '') + (t.name === selectedName ? ' selected' : '');
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
    const hidden = spoilerHides(state, t);
    const name = document.createElement('div');
    name.className = 't-name';
    name.textContent = hidden ? 'Hidden story trophy — earn it to reveal' : t.name;
    const desc = document.createElement('div');
    desc.className = 't-desc' + (hidden ? ' t-hidden-note' : '');
    desc.textContent = hidden ? 'Spoiler-free mode is on: this story trophy stays hidden until earned.' : t.description;
    const tags = document.createElement('div');
    tags.className = 't-tags';
    const grade = document.createElement('span');
    grade.className = 'badge ' + t.grade;
    grade.textContent = t.grade;
    tags.append(grade);
    const kind = document.createElement('span');
    kind.className = 'tag kind';
    kind.textContent = KIND_LABELS[t.kind] || t.kind;
    tags.append(kind);
    if (t.hidden) {
      const h = document.createElement('span');
      h.className = 'tag hidden-tag';
      h.textContent = 'Hidden';
      tags.append(h);
    }
    if (t.missable) {
      const m = document.createElement('span');
      m.className = 'tag missable';
      m.textContent = 'Missable';
      tags.append(m);
    }
    body.append(name, desc, tags);
    if (t.count) {
      const done = countValue(state, t);
      const c = document.createElement('div');
      c.className = 't-count';
      const label = document.createElement('span');
      label.textContent = done + ' / ' + formatCount(t);
      const bar = document.createElement('span');
      bar.className = 'mini-bar';
      const fill = document.createElement('i');
      fill.style.width = Math.round((done / t.count) * 100) + '%';
      bar.append(fill);
      c.append(label, bar);
      body.append(c);
    }
    const spacer = document.createElement('div');
    li.append(box, body, spacer);
    li.addEventListener('click', (event) => {
      if (event.target.closest('input, button, textarea, select, a')) return;
      onSelect(t.name, false);
    });
    listEl.append(li);
  }
}

function sourceLink(doc, ref) {
  const src = doc.sources.find((s) => s.ref === ref);
  if (!src) return null;
  const a = document.createElement('a');
  a.href = src.url;
  a.target = '_blank';
  a.rel = 'noopener';
  a.textContent = '[' + src.ref + '] ' + src.name + ' — retrieved ' + src.retrieved;
  return a;
}

export function renderDetail(detailEl, doc, trophy, state, onChanged) {
  detailEl.replaceChildren();
  if (!trophy) {
    const p = document.createElement('p');
    p.textContent = 'Pick a trophy from the list to read its guide, steps and sources.';
    detailEl.append(p);
    return;
  }
  const hidden = spoilerHides(state, trophy);
  const title = document.createElement('h2');
  title.textContent = hidden ? 'Hidden story trophy' : trophy.name;
  detailEl.append(title);
  const tags = document.createElement('div');
  tags.className = 't-tags';
  const grade = document.createElement('span');
  grade.className = 'badge ' + trophy.grade;
  grade.textContent = trophy.grade;
  tags.append(grade);
  const kind = document.createElement('span');
  kind.className = 'tag kind';
  kind.textContent = KIND_LABELS[trophy.kind] || trophy.kind;
  tags.append(kind);
  if (trophy.missable) {
    const m = document.createElement('span');
    m.className = 'tag missable';
    m.textContent = 'Missable';
    tags.append(m);
  }
  detailEl.append(tags);
  const official = document.createElement('p');
  official.className = 'official';
  const label = document.createElement('b');
  label.textContent = 'Official description — PlayStation';
  official.append(label);
  official.append(document.createTextNode(hidden ? 'Hidden until earned.' : trophy.description));
  detailEl.append(official);
  if (trophy.missable) {
    const call = document.createElement('p');
    call.className = 'missable-callout';
    call.textContent = 'Do the Chapter 1 meditation before Chapter 1 ends. See the Missable tab for the save plan.';
    const b = document.createElement('b');
    b.textContent = 'Possibly missable. ';
    call.prepend(b);
    detailEl.append(call);
  }
  if (!hidden) {
    const guide = document.createElement('p');
    guide.className = 'guide-text';
    guide.textContent = trophy.guide;
    detailEl.append(guide);
    const srcLine = document.createElement('p');
    srcLine.className = 'src-line';
    srcLine.textContent = 'Sources: ' + trophy.sources.map((ref) => {
      const s = doc.sources.find((x) => x.ref === ref);
      return '[' + ref + '] ' + (s ? s.name.split(' — ')[0] : ref);
    }).join(' · ');
    detailEl.append(srcLine);
    const stepsTitle = document.createElement('h3');
    stepsTitle.textContent = 'Steps';
    detailEl.append(stepsTitle);
    const steps = document.createElement('ol');
    steps.className = 'steps';
    for (const s of trophy.steps) {
      const li = document.createElement('li');
      li.textContent = s;
      steps.append(li);
    }
    detailEl.append(steps);
  } else {
    const note = document.createElement('p');
    note.className = 'guide-text t-hidden-note';
    note.textContent = 'Spoiler-free mode is hiding this story trophy. Earn it in the game (or turn the spoiler setting off) to read its guide.';
    detailEl.append(note);
  }
  if (trophy.count && !hidden) {
    const stepper = document.createElement('div');
    stepper.className = 'stepper';
    const minus = document.createElement('button');
    minus.type = 'button';
    minus.textContent = '−';
    minus.setAttribute('aria-label', 'Decrease count');
    const out = document.createElement('output');
    out.textContent = countValue(state, trophy) + ' / ' + formatCount(trophy);
    const plus = document.createElement('button');
    plus.type = 'button';
    plus.textContent = '+';
    plus.setAttribute('aria-label', 'Increase count');
    const refresh = () => { out.textContent = countValue(state, trophy) + ' / ' + formatCount(trophy); };
    minus.addEventListener('click', () => { setCountValue(state, trophy, countValue(state, trophy) - 1); refresh(); onChanged(); });
    plus.addEventListener('click', () => { setCountValue(state, trophy, countValue(state, trophy) + 1); refresh(); onChanged(); });
    stepper.append(minus, out, plus);
    detailEl.append(stepper);
  }
  const actions = document.createElement('div');
  actions.className = 'detail-actions';
  const mark = document.createElement('button');
  mark.type = 'button';
  mark.className = 'primary';
  mark.textContent = isEarned(state, trophy) ? 'Mark not earned' : 'Mark earned';
  mark.addEventListener('click', () => { toggleEarned(state, trophy); onChanged(); });
  const next = document.createElement('button');
  next.type = 'button';
  next.textContent = 'Why this order? ' + planReason(trophy, state);
  next.addEventListener('click', () => { document.querySelector('[data-view="nextup"]').click(); });
  actions.append(mark, next);
  detailEl.append(actions);
  const noteLabel = document.createElement('label');
  noteLabel.className = 'note-label';
  noteLabel.textContent = 'Your note (saved in this browser)';
  const noteBox = document.createElement('textarea');
  noteBox.className = 'note-box';
  noteBox.value = getNote(state, trophy);
  noteBox.placeholder = 'e.g. best spot, loadout, what worked…';
  noteBox.addEventListener('input', () => setNote(state, trophy, noteBox.value));
  detailEl.append(noteLabel, noteBox);
  const sources = document.createElement('div');
  sources.className = 'sources';
  const sb = document.createElement('b');
  sb.textContent = 'Sources — where each fact comes from';
  sources.append(sb);
  for (const ref of trophy.sources) {
    const link = sourceLink(doc, ref);
    if (link) sources.append(link);
  }
  const srcNote = document.createElement('p');
  srcNote.textContent = 'Guide text is written in our own words for this atlas. A specific place or step with no source earns no trust — see Sources & about.';
  sources.append(srcNote);
  detailEl.append(sources);
}
