import { loadRepository, esc, norm, actorClaim, evidenceHtml } from './data-loader.js';

const d = await loadRepository();
let cat = 'all', stance = 'all', q = '';
const title = document.getElementById('title');
const subtitle = document.getElementById('subtitle');
const notice = document.getElementById('notice');
const categories = document.getElementById('categories');
const stances = document.getElementById('stances');
const count = document.getElementById('count');
const grid = document.getElementById('grid');
const detail = document.getElementById('detail');
const dialog = document.getElementById('dialog');
const search = document.getElementById('search');
const reset = document.getElementById('reset');

title.textContent = d.meta.title;
subtitle.textContent = d.meta.subtitle;
notice.textContent = d.meta.data_notice;

const stanceColor = s => d.taxonomy.stances[s]?.color || '#64748b';
const hiddenCats = ['project', 'context', 'griefs', 'sources'];

function filters() {
  categories.innerHTML = Object.entries(d.taxonomy.categories).filter(([k]) => !hiddenCats.includes(k)).map(([k, v]) => {
    const num = k === 'all' ? d.actors.filter(a => a.categories && !hiddenCats.includes(a.categories[0])).length : d.actors.filter(a => a.categories && a.categories.includes(k)).length;
    return `<button class="filter ${cat === k ? 'active' : ''}" data-cat="${k}"><span>${esc(v.label)}</span><b>${num}</b></button>`;
  }).join('');

  stances.innerHTML = Object.entries(d.taxonomy.stances).map(([k, v]) => {
    const num = k === 'all' ? d.claims.length : d.claims.filter(c => c.value === k).length;
    return `<button class="filter ${stance === k ? 'active' : ''}" data-stance="${k}"><span>${esc(v.label)}</span><b>${num}</b></button>`;
  }).join('');
}

function render() {
  const list = d.actors.filter(a => a.id !== 'project_gascogne' && a.categories && !hiddenCats.includes(a.categories[0])).filter(a => {
    const c = actorClaim(d, a.id);
    const text = norm([a.name, a.description, c?.summary, ...(c?.evidence_ids || []).map(id => d.evidenceById.get(id)?.text)].join(' '));
    return (cat === 'all' || a.categories.includes(cat)) && (stance === 'all' || c?.value === stance) && (!q || text.includes(q));
  });

  count.textContent = `${list.length} acteurs affichés sur ${d.actors.filter(a => a.categories && !hiddenCats.includes(a.categories[0])).length}`;

  grid.innerHTML = list.map(a => {
    const c = actorClaim(d, a.id);
    const badgeLabel = d.taxonomy.stances[c?.value]?.label || 'Non qualifié';
    const certitudeLabel = d.taxonomy.certainty_levels[c?.certainty]?.label || 'Non qualifiée';
    return `<article class="card" data-id="${a.id}" style="--stance:${stanceColor(c?.value)}"><h3>${esc(a.name)}</h3><div class="role">${esc(a.description)}</div><p class="position">${esc(c?.summary || 'Position non renseignée')}</p><div class="footer"><span class="badge">${esc(badgeLabel)}</span><span>Certitude : ${esc(certitudeLabel)}</span></div></article>`;
  }).join('');
}

function open(id) {
  const a = d.actorById.get(id);
  const c = actorClaim(d, id);
  const rel = d.relations.filter(r => r.source_id === id || r.target_id === id);

  const relHtml = rel.length ? rel.map(r => {
    const other = d.actorById.get(r.source_id === id ? r.target_id : r.source_id);
    const relationLabel = d.taxonomy.relation_types[r.type]?.label || r.type;
    const certitudeLabel = d.taxonomy.certainty_levels[r.certainty]?.label || r.certainty;
    const evidenceCount = (r.evidence_ids || []).length;
    return `<div class="relation"><button data-open="${other?.id}">${esc(other?.name || 'Acteur inconnu')}</button><div><b>${esc(relationLabel)}</b></div><p>${esc(r.summary)}</p><small>Certitude : ${esc(certitudeLabel)} · ${evidenceCount} preuve(s)</small></div>`;
  }).join('') : '<p class="muted">Aucune relation.</p>';

  const certitudeVal = d.taxonomy.certainty_levels[c?.certainty]?.label || 'Non qualifiée';
  detail.innerHTML = `<h2>${esc(a.name)}</h2><p class="role">${esc(a.description)}</p><h3>Position</h3><p>${esc(c?.summary || 'Non renseignée')}</p><p><b>Certitude :</b> ${esc(certitudeVal)}</p><h3>Preuves et sources</h3>${evidenceHtml(d, c?.evidence_ids)}<h3>Relations documentables</h3>${relHtml}`;
  dialog.showModal();
}

document.addEventListener('click', e => {
  const cBtn = e.target.closest('[data-cat]');
  const sBtn = e.target.closest('[data-stance]');
  const card = e.target.closest('.card');
  const op = e.target.closest('[data-open]');
  const closeBtn = e.target.closest('.close');

  if (cBtn) { cat = cBtn.dataset.cat; filters(); render(); }
  if (sBtn) { stance = sBtn.dataset.stance; filters(); render(); }
  if (card && !e.target.closest('button')) open(card.dataset.id);
  if (op) open(op.dataset.open);
  if (closeBtn) dialog.close();
});

search.addEventListener('input', e => { q = norm(e.target.value); render(); });
reset.onclick = () => { cat = 'all'; stance = 'all'; q = ''; search.value = ''; filters(); render(); };

filters();
render();
