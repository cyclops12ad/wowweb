// Lo que tú decides. Los datos del juego (clase, iLvl, M+, bandas…) se leen de Raider.IO al generar la web.
import { getCharacter } from './raiderio.js';

export const mainRef = { region: 'eu', realm: 'sanguino', name: 'Cyclòps' };

// Añade aquí tus alters con el mismo formato y aparecerán en "Personajes"
export const altRefs = [];

export const tagline = 'Paladín sagrado de Mítica+ y bandas míticas.';

export const main = await getCharacter(mainRef);
export const characters = [main, ...(await Promise.all(altRefs.map(getCharacter)))];

export const posts = [
  { tag: 'Guía', date: '2026-10-12', title: 'Mi ruta de Mítica+ esta temporada', excerpt: 'Cómo enfoco cada mazmorra como sanador y qué cambio según los afijos.' },
  { tag: 'Diario', date: '2026-10-03', title: 'Por fin: banda en mítico', excerpt: 'Crónica de la noche en la que la hermandad tumbó otro jefe mítico.' },
  { tag: 'Build', date: '2026-09-21', title: 'Talentos y estadísticas que uso', excerpt: 'Mi configuración actual de Paladín sagrado explicada paso a paso.' },
];

export const links = [
  { label: 'Raider.IO', href: main.url },
  { label: 'Warcraft Logs', href: `https://www.warcraftlogs.com/character/${mainRef.region}/${mainRef.realm}/${encodeURIComponent(mainRef.name)}` },
  { label: 'Discord', href: '#' },
];
