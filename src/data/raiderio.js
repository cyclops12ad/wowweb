// Lee personajes de la API pública de Raider.IO al generar la web.
// shortcut: si la API falla, la build falla (Pages mantiene la versión anterior); añadir caché si pasa a menudo.
import { classes, specs, races, roles } from './es.js';

const API = 'https://raider.io/api/v1';
const cache = new Map();

async function getJson(url) {
  if (!cache.has(url)) {
    cache.set(
      url,
      fetch(url).then(async (res) => {
        if (!res.ok) throw new Error(`Raider.IO ${res.status} en ${url}: ${await res.text()}`);
        return res.json();
      }),
    );
  }
  return cache.get(url);
}

const tr = (map, key) => map[key] ?? key;

function raidProgress(progression, staticRaids, region) {
  return staticRaids
    .map((raid) => {
      const p = progression[raid.slug];
      if (!p) return null;
      const [difficulty, killed] =
        p.mythic_bosses_killed > 0 ? ['M', p.mythic_bosses_killed]
        : p.heroic_bosses_killed > 0 ? ['H', p.heroic_bosses_killed]
        : ['N', p.normal_bosses_killed];
      return { name: raid.name, total: p.total_bosses, killed, difficulty, starts: raid.starts[region] };
    })
    .filter((r) => r && r.killed > 0)
    .sort((a, b) => b.starts.localeCompare(a.starts) || b.total - a.total);
}

export async function getCharacter({ region, realm, name }) {
  const fields = 'gear,guild,raid_progression,mythic_plus_scores_by_season:current,mythic_plus_best_runs';
  const query = new URLSearchParams({ region, realm, name, fields });
  const c = await getJson(`${API}/characters/profile?${query}`);
  const expansion = Object.values(c.raid_progression ?? {})[0]?.expansion_id;
  const { raids: staticRaids } = expansion ? await getJson(`${API}/raiding/static-data?expansion_id=${expansion}`) : { raids: [] };
  const season = c.mythic_plus_scores_by_season?.[0]?.segments.all;
  const raids = raidProgress(c.raid_progression ?? {}, staticRaids, region);

  return {
    name: c.name,
    realm: c.realm,
    region: c.region.toUpperCase(),
    faction: c.faction === 'horde' ? 'Horda' : 'Alianza',
    guild: c.guild?.name,
    classKey: c.class,
    className: tr(classes, c.class),
    spec: tr(specs, c.active_spec_name),
    race: tr(races, c.race),
    role: tr(roles, c.active_spec_role),
    ilvl: Math.round(c.gear?.item_level_equipped ?? 0),
    achievementPoints: c.achievement_points,
    score: Math.round(season?.score ?? 0),
    scoreColor: season?.color ?? 'var(--q-legendary)',
    avatar: c.thumbnail_url,
    url: c.profile_url,
    raids,
    mainRaid: raids.find((r) => r.total > 1) ?? raids[0],
    bestRuns: (c.mythic_plus_best_runs ?? []).slice(0, 3).map((r) => ({
      dungeon: r.dungeon,
      level: r.mythic_level,
      upgrades: r.num_keystone_upgrades,
      url: r.url,
    })),
  };
}
