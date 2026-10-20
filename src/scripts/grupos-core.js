// Planificador de grupos (Classic / Forever): datos y lógica sin DOM, para poder probarla con `node --test`.

export const CLASSES = [
  { k: 'war', a: 'Placas', n: 'Guerrero', c: '#C69B6D', s: [['arms', 'Armas', 'D'], ['fury', 'Furia', 'D'], ['prot', 'Protección', 'T']] },
  { k: 'pal', a: 'Placas', n: 'Paladín', c: '#F48CBA', s: [['holy', 'Sagrado', 'H'], ['prot', 'Protección', 'T'], ['ret', 'Reprensión', 'D']] },
  { k: 'hun', a: 'Malla', n: 'Cazador', c: '#AAD372', s: [['bm', 'Bestias', 'D'], ['mm', 'Puntería', 'D'], ['sv', 'Supervivencia', 'D']] },
  { k: 'rog', a: 'Cuero', n: 'Pícaro', c: '#FFF468', s: [['ass', 'Asesinato', 'D'], ['combat', 'Combate', 'D'], ['sub', 'Sutileza', 'D']] },
  { k: 'pri', a: 'Tela', n: 'Sacerdote', c: '#FFFFFF', s: [['disc', 'Disciplina', 'H'], ['holy', 'Sagrado', 'H'], ['sha', 'Sombra', 'D']] },
  { k: 'sha', a: 'Malla', n: 'Chamán', c: '#0070DD', s: [['ele', 'Elemental', 'D'], ['enh', 'Mejora', 'DT'], ['resto', 'Restauración', 'H']] },
  { k: 'mag', a: 'Tela', n: 'Mago', c: '#3FC7EB', s: [['arc', 'Arcano', 'D'], ['fire', 'Fuego', 'D'], ['frost', 'Escarcha', 'D']] },
  { k: 'loc', a: 'Tela', n: 'Brujo', c: '#8788EE', s: [['aff', 'Aflicción', 'D'], ['demo', 'Demonología', 'D'], ['destro', 'Destrucción', 'D']] },
  { k: 'dru', a: 'Cuero', n: 'Druida', c: '#FF7C0A', s: [['bal', 'Equilibrio', 'D'], ['feral', 'Feral', 'DT'], ['resto', 'Restauración', 'H']] },
];
export const ROLE = { T: 'Tanque', H: 'Healer', D: 'DPS' };
export const ARMOR = ['Tela', 'Cuero', 'Malla', 'Placas'];
export const PROFS = [
  { k: 'herbalch', g: 'Herboristería', c: 'Alquimia', armors: null, note: 'Pociones, elixires y frascos para todo el grupo. Sirve a cualquier armadura; rinde más en healers y casters que gastan maná.' },
  { k: 'minebs', g: 'Minería', c: 'Herrería', armors: ['Placas', 'Malla'], note: 'Fabrica armas, escudos y armadura de malla y placas. Ideal para Guerrero o Paladín.' },
  { k: 'mineeng', g: 'Minería', c: 'Ingeniería', armors: null, note: 'Bombas, gafas, miras y munición. Sirve a cualquier armadura; destaca en Cazador, Pícaro y Guerrero.' },
  { k: 'skinlw', g: 'Desuello', c: 'Peletería', armors: ['Cuero', 'Malla'], note: 'Fabrica armadura de cuero y malla, kits de armadura y carcajes. Ideal para Pícaro, Druida, Cazador o Chamán.' },
  { k: 'enchtail', g: 'Encantamiento', c: 'Sastrería', armors: ['Tela'], note: 'Fabrica armadura de tela y desencanta lo que sobra. Ideal para Mago, Sacerdote o Brujo.' },
];

export const PBY = Object.fromEntries(PROFS.map((x) => [x.k, x]));
export const CBY = Object.fromEntries(CLASSES.map((c) => [c.k, c]));
export const SPECS = CLASSES.flatMap((c) => c.s.map(([k, n, r]) => ({ key: `${c.k}.${k}`, cls: c, name: n, roles: r.split('') })));
export const BYKEY = Object.fromEntries(SPECS.map((s) => [s.key, s]));

export const DEFAULT_STATE = {
  players: ['Adrián', 'Jokin', 'Jon', 'Ibai', 'Jorge'].map((name, i) => ({ id: `p${i + 1}`, name, bans: [], roleBans: [], favs: [] })),
  unique: true,
  showSpec: false,
  armorMix: false,
  flex22: false,
  prof: { enchtail: 'p1' },
  saved: [],
};

export const allowed = (p) =>
  SPECS.filter((s) => !p.bans.includes(s.key)).flatMap((s) =>
    s.roles.filter((r) => !p.roleBans.includes(r)).map((r) => ({ key: s.key, cls: s.cls, name: s.name, role: r })),
  );

export function profOf(prof, pid) {
  const k = Object.keys(prof || {}).find((k) => prof[k] === pid);
  return k ? PBY[k] : null;
}

// Todas las combinaciones de 1 tanque, 1 healer y 3 DPS que respetan vetos y filtros
export function enumerate(state, cap = 100000) {
  const ps = state.players.slice(0, 5);
  const need = { T: 1, H: 1, D: 3 };
  const opts = ps.map((p) => {
    let list = allowed(p).map((o) => ({ ...o, fav: p.favs.includes(o.cls.k) }));
    if (!state.showSpec) {
      const seen = new Set();
      list = list.filter((o) => !seen.has(o.cls.k + o.role) && seen.add(o.cls.k + o.role));
    }
    return list.sort((x, y) => y.fav - x.fav);
  });
  const can = new Map(
    ps.map((p) => {
      const m = {};
      allowed(p).forEach((o) => (m[o.cls.k] ??= new Set()).add(o.role));
      return [p.id, m];
    }),
  );
  const combos = [];
  const pick = [];
  const count = { T: 0, H: 0, D: 0 };
  const used = new Set();
  let truncated = false;

  (function dfs(i) {
    if (combos.length >= cap) return void (truncated = true);
    if (i === ps.length) {
      const free = [];
      for (const r of ['T', 'H', 'D']) for (let k = count[r]; k < need[r]; k++) free.push(r);
      const variety = new Set(pick.map((o) => o.cls.a)).size;
      if (state.armorMix && variety < Math.min(4, ps.length)) return;
      const fT = pick.filter((o) => can.get(o.pid)[o.cls.k].has('T')).length;
      const fH = pick.filter((o) => can.get(o.pid)[o.cls.k].has('H')).length;
      if (state.flex22 && (fT < 2 || fH < 2)) return;
      combos.push({ picks: pick.slice(), free, variety, fT, fH, score: pick.filter((o) => o.fav).length });
      return;
    }
    for (const o of opts[i]) {
      if (count[o.role] >= need[o.role] || (state.unique && used.has(o.cls.k))) continue;
      count[o.role]++;
      used.add(o.cls.k);
      pick.push({ pid: ps[i].id, ...o });
      dfs(i + 1);
      count[o.role]--;
      used.delete(o.cls.k);
      pick.pop();
      if (truncated) return;
    }
  })(0);

  combos.sort((x, y) => y.score - x.score || y.variety - x.variety);
  return { combos, truncated };
}

export function failReason(state) {
  const ps = state.players.slice(0, 5);
  for (const r of ['T', 'H'])
    if (ps.length === 5 && !ps.some((p) => allowed(p).some((s) => s.role === r))) return `Nadie puede ir de ${ROLE[r].toLowerCase()}.`;
  const empty = ps.find((p) => !allowed(p).length);
  if (empty) return `${empty.name || 'Un jugador'} lo tiene todo vetado.`;
  return state.unique ? 'Prueba a permitir clases repetidas o a quitar algún veto.' : 'Los vetos chocan entre sí; quita alguno.';
}

export const toSaved = (state, c) => ({
  prof: { ...state.prof },
  picks: c.picks.map((o) => ({ pid: o.pid, cls: o.cls.k, role: o.role, spec: state.showSpec ? o.key : null })),
  free: c.free.slice(),
});

export const sig = (t) =>
  t.picks
    .map((x) => `${x.pid}:${x.cls}:${x.role}:${x.spec || ''}`)
    .sort()
    .join('|');

// --- Entrada externa (localStorage o enlace compartido): solo pasa lo que conocemos ---

const ID = /^[\w-]{1,24}$/;
const has = (obj, k) => typeof k === 'string' && Object.hasOwn(obj, k);
const str = (v, n) => (typeof v === 'string' ? v.trim().slice(0, n) : '');
const list = (v, ok, max = 50) => (Array.isArray(v) ? v.slice(0, max).filter(ok) : []);
const set = (v, ok) => [...new Set(list(v, ok))];

export function sanitize(raw) {
  if (!raw || typeof raw !== 'object' || !Array.isArray(raw.players)) return null;
  const ids = new Set();
  const players = list(raw.players, (p) => p && ID.test(p.id) && !ids.has(p.id) && ids.add(p.id), 5).map((p) => ({
    id: p.id,
    name: str(p.name, 24),
    bans: set(p.bans, (k) => has(BYKEY, k)),
    roleBans: set(p.roleBans, (r) => has(ROLE, r)),
    favs: set(p.favs, (k) => has(CBY, k)),
  }));
  const prof = (m) =>
    Object.fromEntries(Object.entries(m && typeof m === 'object' ? m : {}).filter(([k, v]) => has(PBY, k) && typeof v === 'string' && ID.test(v)));
  const saved = list(raw.saved, (t) => t && ID.test(t.id)).map((t) => ({
    id: t.id,
    name: str(t.name, 40) || 'Plantilla',
    prof: prof(t.prof),
    picks: list(t.picks, (x) => x && ID.test(x.pid) && has(CBY, x.cls) && has(ROLE, x.role) && (x.spec == null || has(BYKEY, x.spec)), 5).map(
      (x) => ({ pid: x.pid, cls: x.cls, role: x.role, spec: x.spec ?? null }),
    ),
    free: list(t.free, (r) => has(ROLE, r), 5),
  }));
  return {
    players,
    unique: !!raw.unique,
    showSpec: !!raw.showSpec,
    armorMix: !!raw.armorMix,
    flex22: !!raw.flex22,
    prof: prof(raw.prof),
    saved,
  };
}

// Estado <-> texto apto para URL (base64url de JSON UTF-8)
export function encodeState(state) {
  const bin = String.fromCharCode(...new TextEncoder().encode(JSON.stringify(state)));
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function decodeState(text) {
  try {
    const bin = atob(text.replace(/-/g, '+').replace(/_/g, '/'));
    return sanitize(JSON.parse(new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)))));
  } catch {
    return null;
  }
}
