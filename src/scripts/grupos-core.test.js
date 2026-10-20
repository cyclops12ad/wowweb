import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_STATE, enumerate, sanitize, encodeState, decodeState, failReason } from './grupos-core.js';

const clone = (s) => structuredClone(s);

test('cada combinación tiene 1 tanque, 1 healer y 3 DPS sin clases repetidas', () => {
  const { combos } = enumerate(DEFAULT_STATE);
  assert.ok(combos.length > 0);
  for (const c of combos.slice(0, 500)) {
    const roles = c.picks.map((o) => o.role).sort().join('');
    assert.equal(roles, 'DDDHT');
    assert.equal(new Set(c.picks.map((o) => o.cls.k)).size, 5);
  }
});

test('los vetos se respetan y sin tanque posible no hay grupos', () => {
  const s = clone(DEFAULT_STATE);
  s.players[0].roleBans = ['T', 'H'];
  assert.ok(enumerate(s).combos.every((c) => c.picks.find((o) => o.pid === 'p1').role === 'D'));
  s.players.forEach((p) => (p.roleBans = ['T']));
  assert.equal(enumerate(s).combos.length, 0);
  assert.equal(failReason(s), 'Nadie puede ir de tanque.');
});

test('las clases preferidas suben arriba', () => {
  const s = clone(DEFAULT_STATE);
  s.players[0].favs = ['pal'];
  const [first] = enumerate(s).combos;
  assert.equal(first.score, 1);
  assert.equal(first.picks.find((o) => o.pid === 'p1').cls.k, 'pal');
});

test('el enlace compartido conserva el estado (con tildes)', () => {
  const s = clone(DEFAULT_STATE);
  s.players[1].bans = ['war.prot'];
  s.saved = [{ id: 's1', name: 'Mañana', prof: {}, picks: [{ pid: 'p1', cls: 'pal', role: 'H', spec: null }], free: ['D'] }];
  assert.deepEqual(decodeState(encodeState(s)), sanitize(s));
  assert.equal(decodeState(encodeState(s)).saved[0].name, 'Mañana');
});

test('un enlace manipulado no cuela HTML ni datos desconocidos', () => {
  const evil = {
    players: [
      { id: 'p1"><img src=x onerror=alert(1)>', name: 'x' },
      { id: 'p2', name: 'Ok', bans: ['war.prot', 'constructor', '__proto__'], roleBans: ['X', 'T'], favs: ['hax'] },
    ],
    prof: { enchtail: '"><b>', toString: 'p2' },
    saved: [{ id: 's1', name: 'A', picks: [{ pid: 'p2', cls: 'nope', role: 'T' }], free: ['Z'] }],
  };
  const s = sanitize(evil);
  assert.equal(s.players.length, 1);
  assert.deepEqual(s.players[0], { id: 'p2', name: 'Ok', bans: ['war.prot'], roleBans: ['T'], favs: [] });
  assert.deepEqual(s.prof, {});
  assert.deepEqual(s.saved[0].picks, []);
  assert.deepEqual(s.saved[0].free, []);
  assert.equal(decodeState('%%%no-es-base64'), null);
  assert.equal(sanitize({ players: 'nope' }), null);
});
