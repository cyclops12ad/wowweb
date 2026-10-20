// Planificador de grupos: pinta el estado y reacciona a los clics. La lógica vive en grupos-core.js.
import {
  CLASSES, ROLE, ARMOR, PROFS, PBY, CBY, BYKEY, DEFAULT_STATE,
  allowed, profOf, enumerate, failReason, toSaved, sig, sanitize, encodeState, decodeState,
} from './grupos-core.js';

const STORE = 'wowweb-grupos';
const PAGE = 30;
const $ = (id) => document.getElementById(id);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const armorChip = (a) => `<span class="arm a${ARMOR.indexOf(a)}">${a}</span>`;
const order = { T: 0, H: 1, D: 2 };

let state = structuredClone(DEFAULT_STATE);
let combos = [];
let truncated = false;
let shown = PAGE;

function setStatus(text, kind = '') {
  $('status').innerHTML = `<span class="dot ${kind}"></span><span>${esc(text)}</span>`;
}

function save() {
  try {
    localStorage.setItem(STORE, JSON.stringify(state));
  } catch {
    setStatus('Este navegador no deja guardar; usa «Compartir» para no perder los cambios');
  }
}

function load() {
  const hash = new URLSearchParams(location.hash.slice(1)).get('s');
  const fromLink = hash && decodeState(hash);
  if (fromLink) {
    state = fromLink;
    save();
    history.replaceState(null, '', location.pathname + location.search);
    setStatus('Configuración cargada desde el enlace', 'ok');
    return;
  }
  if (hash) setStatus('El enlace no era válido; se usa tu configuración guardada');
  try {
    const stored = sanitize(JSON.parse(localStorage.getItem(STORE)));
    if (stored) state = stored;
  } catch {}
  if (!hash) setStatus('Se guarda en este navegador', 'ok');
}

async function share() {
  const url = `${location.origin}${location.pathname}#s=${encodeState(state)}`;
  try {
    await navigator.clipboard.writeText(url);
    setStatus('Enlace copiado: pásaselo al grupo', 'ok');
  } catch {
    const box = $('shareUrl');
    box.hidden = false;
    box.value = url;
    box.select();
    setStatus('Copia este enlace y pásaselo al grupo');
  }
}

function slotHTML(t, x) {
  const p = state.players.find((p) => p.id === x.pid);
  const c = CBY[x.cls];
  const ok = p && allowed(p).some((a) => a.cls.k === x.cls && a.role === x.role && (!x.spec || a.key === x.spec));
  const pr = p ? profOf(t.prof, p.id) : null;
  const fit = pr && pr.armors ? pr.armors.includes(c.a) : null;
  const select = p
    ? `<select class="sprof" data-sprof="${t.id}|${p.id}" aria-label="Profesión de ${esc(p.name)}"><option value="">Sin profesión</option>${PROFS.map((x) => {
        const owner = t.prof[x.k];
        const other = owner && owner !== p.id ? state.players.find((q) => q.id === owner) : null;
        return `<option value="${x.k}"${pr && pr.k === x.k ? ' selected' : ''}>${esc(`${x.c} · ${x.g}`)}${other ? ` (${esc(other.name)})` : ''}</option>`;
      }).join('')}</select>`
    : '';
  const what = (x.spec && BYKEY[x.spec] ? `${esc(BYKEY[x.spec].name)} · ` : '') + esc(c.n);
  const fitLine = pr && pr.armors ? `<span class="pline${fit ? '' : ' bad'}">${fit ? 'Armadura acorde ✓' : `No lleva ${esc(pr.armors.join(' ni ').toLowerCase())} ✕`}</span>` : '';
  return `<div class="sslot${ok ? '' : ' stale'}"><span class="role ${x.role}">${ROLE[x.role]}</span><span class="cname">${esc(p ? p.name || 'Sin nombre' : 'Jugador quitado')}</span><span class="what"><span class="sw" style="background:${c.c}"></span>${what}</span>${armorChip(c.a)}${select}${fitLine}${ok ? '' : '<span class="pline bad">Ya no encaja con sus vetos</span>'}</div>`;
}

function renderSaved() {
  if (!state.saved.length) {
    $('saved').innerHTML = '<div class="empty">Aún no hay plantillas. Pulsa «Guardar» en cualquier grupo de la lista de abajo.</div>';
    return;
  }
  $('saved').innerHTML = `<div class="saved-list">${state.saved
    .map((t) => {
      const slots = t.picks
        .map((x) => ({ r: x.role, h: slotHTML(t, x) }))
        .concat(t.free.map((r) => ({ r, h: `<div class="sslot free"><span class="role ${r}">${ROLE[r]}</span><span class="cname">Plaza libre</span></div>` })))
        .sort((a, b) => order[a.r] - order[b.r]);
      return `<article class="saved-card"><div class="saved-head"><input type="text" data-sname="${t.id}" value="${esc(t.name)}" aria-label="Nombre de la plantilla" maxlength="40"><button class="x" data-unsave="${t.id}" aria-label="Borrar ${esc(t.name)}">✕</button></div><div class="saved-slots">${slots.map((x) => x.h).join('')}</div></article>`;
    })
    .join('')}</div>`;
}

function cellHTML(o) {
  const p = state.players.find((p) => p.id === o.pid);
  const what = (state.showSpec ? `${esc(o.name)} · ` : '') + esc(o.cls.n);
  return `<td><span class="cname">${esc(p ? p.name || 'Sin nombre' : '?')}${o.fav ? ' <span class="star" title="Clase preferida">★</span>' : ''}</span><span class="what"><span class="sw" style="background:${o.cls.c}"></span>${what}</span>${armorChip(o.cls.a)}</td>`;
}

function renderTeam() {
  const el = $('team');
  ({ combos, truncated } = enumerate(state));
  const n = combos.length;
  if (!n) {
    $('count').textContent = '';
    el.innerHTML = `<div class="warn"><b>No sale ningún grupo válido.</b> ${esc(failReason(state))}</div>`;
    return;
  }
  const best = combos[0].score;
  const top = combos.filter((c) => c.score === best).length;
  $('count').innerHTML =
    `<b>${truncated ? 'Más de ' : ''}${n.toLocaleString('es-ES')}</b> combinaciones` +
    (best ? ` · ${top.toLocaleString('es-ES')} con ${best} clase${best > 1 ? 's' : ''} preferida${best > 1 ? 's' : ''}` : '') +
    (state.armorMix ? ' con una de cada armadura' : '') +
    (state.flex22 ? ', con al menos 2 que pueden tanquear y 2 que pueden curar' : '') +
    '. Arriba, las que tienen más preferidas y luego más variedad de armadura.';
  const saved = new Set(state.saved.map(sig));
  const rows = combos
    .slice(0, shown)
    .map((c, i) => {
      const cells = c.picks
        .map((x) => ({ r: x.role, h: cellHTML(x) }))
        .concat(c.free.map((r) => ({ r, h: '<td class="freec">Plaza libre</td>' })))
        .sort((a, b) => order[a.r] - order[b.r]);
      return `<tr><td class="num">${i + 1}</td>${cells.map((x) => x.h).join('')}<td class="num flex"><span class="role T">${c.fT}T</span> <span class="role H">${c.fH}H</span></td><td class="num">${c.variety}/4</td><td class="num">${c.score ? `<span class="star">${'★'.repeat(c.score)}</span>` : ''}</td><td>${saved.has(sig(toSaved(state, c))) ? '<span class="saved-tag">Guardada</span>' : `<button class="ghost save" data-save="${i}">Guardar</button>`}</td></tr>`;
    })
    .join('');
  el.innerHTML =
    `<div class="scroll"><table class="combos"><thead><tr><th class="num">#</th><th><span class="role T">Tanque</span></th><th><span class="role H">Healer</span></th><th><span class="role D">DPS</span></th><th><span class="role D">DPS</span></th><th><span class="role D">DPS</span></th><th class="num" title="Jugadores cuya clase puede tanquear / curar">Flex</th><th class="num">Armad.</th><th class="num">Pref.</th><th></th></tr></thead><tbody>${rows}</tbody></table></div>` +
    (n > shown ? `<button class="ghost more" id="more">Ver ${Math.min(PAGE, n - shown)} más (${(n - shown).toLocaleString('es-ES')} restantes)</button>` : '');
}

function renderProfs() {
  $('profs').innerHTML = PROFS.map((pr) => {
    const cls = pr.armors ? CLASSES.filter((c) => pr.armors.includes(c.a)).map((c) => c.n) : null;
    return `<div class="prof"><div class="pname"><span>${pr.g}</span><span class="plus">+</span><span>${pr.c}</span></div><div class="parm">${pr.armors ? pr.armors.map(armorChip).join(' ') : '<span class="arm">Cualquier armadura</span>'}</div><p class="pnote">${pr.note}</p>${cls ? `<p class="fit"><span class="lbl">Clases que lo aprovechan</span><br>${cls.join(', ')}</p>` : ''}</div>`;
  }).join('');
}

function renderPlayers() {
  $('players').innerHTML = state.players
    .map(
      (p) =>
        `<div class="pl"><div class="plrow"><input type="text" data-name="${p.id}" value="${esc(p.name)}" aria-label="Nombre" maxlength="24"><button class="x" data-del="${p.id}" aria-label="Quitar a ${esc(p.name)}">✕</button></div><div><div class="lbl">No quiere jugar de</div><div class="pills">${['T', 'H', 'D']
          .map((r) => `<button class="pill" data-role="${p.id}|${r}" aria-pressed="${p.roleBans.includes(r)}">${ROLE[r]}</button>`)
          .join('')}</div></div></div>`,
    )
    .join('');
  $('add').hidden = state.players.length >= 5;
  $('cover').innerHTML = ['T', 'H', 'D']
    .map((r) => {
      const who = state.players.filter((p) => allowed(p).some((s) => s.role === r)).map((p) => p.name || 'Sin nombre');
      return `<dt>${ROLE[r]}</dt><dd>${who.length ? esc(who.join(', ')) : '<span class="none">Nadie</span>'}</dd>`;
    })
    .join('');
}

function renderMatrix() {
  const ps = state.players;
  let h = `<thead><tr><th class="spec">Especialización</th>${ps.map((p) => `<th>${esc(p.name || '—')}</th>`).join('')}</tr></thead><tbody>`;
  for (const c of CLASSES) {
    h += `<tr class="cls"><th class="spec"><span class="clsname"><span class="sw" style="background:${c.c}"></span>${c.n} ${armorChip(c.a)}</span></th>${ps
      .map((p) => {
        const all = c.s.every(([k]) => p.bans.includes(`${c.k}.${k}`));
        const fav = p.favs.includes(c.k);
        return `<td><div class="clscell"><button class="fav" data-fav="${p.id}|${c.k}" aria-pressed="${fav}" aria-label="${esc(p.name)}: ${c.n} preferida" title="Preferida">${fav ? '★' : '☆'}</button><button class="all${all ? ' ban' : ''}" data-cls="${p.id}|${c.k}">${all ? '✕ clase' : 'vetar'}</button></div></td>`;
      })
      .join('')}</tr>`;
    for (const [k, n, r] of c.s) {
      const key = `${c.k}.${k}`;
      h += `<tr><td class="spec">${r
        .split('')
        .map((x) => `<span class="rb ${x}" title="${ROLE[x]}">${x}</span>`)
        .join('')}${n}</td>${ps
        .map((p) => {
          const banned = p.bans.includes(key);
          const off = r.split('').every((x) => p.roleBans.includes(x));
          return `<td><button class="cell ${banned ? 'ban' : off ? 'off' : ''}" data-spec="${p.id}|${key}" aria-pressed="${banned}" aria-label="${esc(p.name)}: ${n} ${c.n}">${banned ? '✕' : off ? '–' : '✓'}</button></td>`;
        })
        .join('')}</tr>`;
    }
  }
  $('matrix').innerHTML = `${h}</tbody>`;
}

function render() {
  for (const id of ['unique', 'showSpec', 'armorMix', 'flex22']) $(id).checked = state[id];
  renderSaved();
  renderTeam();
  renderPlayers();
  renderMatrix();
}

function changed() {
  shown = PAGE;
  render();
  save();
}

const player = (pid) => state.players.find((p) => p.id === pid);
const toggle = (arr, v) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

document.addEventListener('click', (e) => {
  const t = e.target.closest('button');
  if (!t) return;
  const d = t.dataset;
  if (t.id === 'share') return void share();
  if (t.id === 'more') {
    shown += PAGE;
    return void renderTeam();
  }
  if (t.id === 'add') {
    if (state.players.length < 5) {
      state.players.push({ id: `p${Date.now().toString(36)}`, name: `Jugador ${state.players.length + 1}`, bans: [], roleBans: [], favs: [] });
      changed();
    }
    return;
  }
  if (d.save) {
    const c = combos[+d.save];
    if (!c) return;
    const names = new Set(state.saved.map((x) => x.name));
    let n = state.saved.length + 1;
    while (names.has(`Plantilla ${n}`)) n++;
    state.saved.push({ id: `s${Date.now().toString(36)}`, name: `Plantilla ${n}`, ...toSaved(state, c) });
    const keep = shown;
    changed();
    shown = keep;
    return void renderTeam();
  }
  if (d.unsave) {
    state.saved = state.saved.filter((x) => x.id !== d.unsave);
    const keep = shown;
    changed();
    shown = keep;
    return void renderTeam();
  }
  if (d.del) {
    for (const k in state.prof) if (state.prof[k] === d.del) delete state.prof[k];
    state.players = state.players.filter((p) => p.id !== d.del);
    return void changed();
  }
  const [pid, v] = (d.role || d.spec || d.fav || d.cls || '').split('|');
  const p = player(pid);
  if (!p) return;
  if (d.role) p.roleBans = toggle(p.roleBans, v);
  else if (d.spec) p.bans = toggle(p.bans, v);
  else if (d.fav) p.favs = toggle(p.favs, v);
  else if (d.cls) {
    const keys = CBY[v].s.map(([k]) => `${v}.${k}`);
    const all = keys.every((k) => p.bans.includes(k));
    p.bans = all ? p.bans.filter((k) => !keys.includes(k)) : [...new Set([...p.bans, ...keys])];
  }
  changed();
});

document.addEventListener('change', (e) => {
  const el = e.target;
  const d = el.dataset || {};
  if (['unique', 'showSpec', 'armorMix', 'flex22'].includes(el.id)) {
    state[el.id] = el.checked;
    return void changed();
  }
  if (d.sprof) {
    const [tid, pid] = d.sprof.split('|');
    const t = state.saved.find((x) => x.id === tid);
    if (!t) return;
    for (const k in t.prof) if (t.prof[k] === pid) delete t.prof[k];
    if (PBY[el.value]) t.prof[el.value] = pid;
    renderSaved();
    return void save();
  }
  if (d.sname) {
    const t = state.saved.find((x) => x.id === d.sname);
    if (t) t.name = el.value.trim().slice(0, 40) || t.name;
    return void save();
  }
  if (d.name) {
    const p = player(d.name);
    if (p) p.name = el.value.trim().slice(0, 24);
    changed();
  }
});

// Pegar un enlace compartido en una pestaña que ya tiene la página abierta no recarga
window.addEventListener('hashchange', () => {
  load();
  changed();
});

renderProfs();
load();
render();
