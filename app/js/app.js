// Leonida Trophy Atlas — boot, header progress, tabs, toolbar and view switching.
import { loadProgress, saveProgress, earnedCount, exportFile, importFileText } from './store.js';
import { kindProgress } from './planner.js';
import { renderTrophyList, renderDetail } from './tracker.js';
import { renderRoadmap, renderMissable, renderNextUp, renderSources } from './pages.js';

const VIEWS = ['tracker', 'roadmap', 'missable', 'nextup', 'sources'];
const KIND_LABELS = { story: 'Story', collectibles: 'Collectibles', activities: 'Activities' };

const state = loadProgress();
const filters = { kind: 'all', grade: 'all', query: '', earnedOnly: false };
let doc = null;
let roadmap = null;
let selectedName = null;

async function loadData() {
  const trophiesRes = await fetch('data/trophies.json');
  doc = await trophiesRes.json();
  const roadmapRes = await fetch('data/roadmap.json');
  roadmap = await roadmapRes.json();
}

function renderHeader() {
  const earned = earnedCount(state, doc.trophies);
  const pct = Math.round((earned / doc.trophies.length) * 100);
  document.getElementById('progressCount').textContent = earned + ' / ' + doc.trophies.length;
  document.getElementById('progressPct').textContent = pct + '% to platinum';
  const byGrade = {};
  for (const t of doc.trophies) {
    if (state.earned[t.name]) byGrade[t.grade] = (byGrade[t.grade] || 0) + 1;
  }
  document.getElementById('progressGrades').textContent =
    (byGrade.platinum || 0) + ' platinum · ' + (byGrade.gold || 0) + ' gold · ' +
    (byGrade.silver || 0) + ' silver · ' + (byGrade.bronze || 0) + ' bronze';
  const ring = document.getElementById('ringFg');
  ring.style.strokeDashoffset = String(226.2 * (1 - earned / doc.trophies.length));
}

function renderKindBars() {
  const el = document.getElementById('kindBars');
  el.replaceChildren();
  for (const k of kindProgress(state, doc.trophies)) {
    const d = document.createElement('div');
    d.className = 'kind-bar';
    const label = document.createElement('b');
    label.textContent = KIND_LABELS[k.kind] + ': ' + k.done + ' / ' + k.total;
    const bar = document.createElement('span');
    bar.className = 'bar';
    const fill = document.createElement('i');
    fill.style.width = (k.total ? Math.round((k.done / k.total) * 100) : 0) + '%';
    bar.append(fill);
    d.append(label, bar);
    el.append(d);
  }
  const miss = document.createElement('div');
  miss.className = 'kind-bar';
  const ml = document.createElement('b');
  const missed = doc.trophies.filter((t) => t.missable && state.earned[t.name]).length;
  ml.textContent = 'Missable: ' + missed + ' / 1 protected';
  miss.append(ml);
  el.append(miss);
}

function selectedTrophy() {
  return doc.trophies.find((t) => t.name === selectedName) || null;
}

function selectTrophy(name, refreshOnly) {
  selectedName = name;
  renderAll();
}

function renderAll() {
  renderHeader();
  renderKindBars();
  renderTrophyList(
    document.getElementById('trophyList'),
    document.getElementById('listMeta'),
    document.getElementById('emptyMsg'),
    doc.trophies, filters, state, selectedName, selectTrophy,
  );
  renderDetail(document.getElementById('detail'), doc, selectedTrophy(), state, renderAll, roadmap);
  renderRoadmap(doc, roadmap, state);
  renderMissable(doc, state, (name) => { selectedName = name; switchView('tracker'); });
  renderNextUp(doc, state, (name) => { selectedName = name; switchView('tracker'); });
  renderSources(doc);
}

function switchView(view) {
  if (!VIEWS.includes(view)) view = 'tracker';
  for (const v of VIEWS) {
    document.getElementById('view-' + v).classList.toggle('active', v === view);
  }
  for (const tab of document.querySelectorAll('#tabs .tab')) {
    tab.classList.toggle('active', tab.dataset.view === view);
  }
  document.getElementById('toolbar').style.display = view === 'tracker' ? '' : 'none';
  if (location.hash !== '#' + view) history.replaceState(null, '', '#' + view);
  if (view === 'tracker') renderAll();
  if (view === 'roadmap') renderRoadmap(doc, roadmap, state);
  if (view === 'missable') renderMissable(doc, state, (name) => { selectedName = name; switchView('tracker'); });
  if (view === 'nextup') renderNextUp(doc, state, (name) => { selectedName = name; switchView('tracker'); });
}

function wireToolbar() {
  for (const chip of document.querySelectorAll('#kindChips .chip')) {
    chip.addEventListener('click', () => {
      for (const c of document.querySelectorAll('#kindChips .chip')) c.classList.toggle('active', c === chip);
      filters.kind = chip.dataset.kind;
      renderAll();
    });
  }
  document.getElementById('search').addEventListener('input', (e) => {
    filters.query = e.target.value.trim();
    renderAll();
  });
  document.getElementById('gradeFilter').addEventListener('change', (e) => {
    filters.grade = e.target.value;
    renderAll();
  });
  document.getElementById('earnedOnly').addEventListener('change', (e) => {
    filters.earnedOnly = e.target.checked;
    renderAll();
  });
  const spoiler = document.getElementById('spoilerToggle');
  spoiler.checked = state.spoiler === true;
  spoiler.addEventListener('change', () => {
    state.spoiler = spoiler.checked;
    saveProgress(state);
    renderAll();
  });
  document.getElementById('exportBtn').addEventListener('click', () => exportFile(state));
  document.getElementById('importFile').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const next = importFileText(await file.text());
      state.earned = next.earned;
      state.counts = next.counts;
      state.notes = next.notes;
      state.spoiler = next.spoiler;
      saveProgress(state);
      spoiler.checked = state.spoiler;
      renderAll();
    } catch {
      alert('That file is not a Leonida Trophy Atlas progress file.');
    }
    e.target.value = '';
  });
  document.getElementById('resetBtn').addEventListener('click', () => {
    if (!confirm('Clear all earned marks, counters and notes?')) return;
    state.earned = {};
    state.counts = {};
    state.notes = {};
    saveProgress(state);
    selectedName = null;
    renderAll();
  });
  for (const tab of document.querySelectorAll('#tabs .tab')) {
    tab.addEventListener('click', () => switchView(tab.dataset.view));
  }
  window.addEventListener('hashchange', () => switchView(location.hash.slice(1)));
}

async function bootAtlas() {
  await loadData();
  if (!selectedName) selectedName = 'Positive Mental Attitude';
  wireToolbar();
  switchView(location.hash.slice(1) || 'tracker');
  renderAll();
}

bootAtlas();
