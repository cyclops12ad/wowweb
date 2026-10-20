// Datos de ejemplo: cámbialos por los tuyos. El diseño se adapta solo.

// Colores oficiales de clase
export const classColors = {
  'Caballero de la Muerte': '#C41E3A',
  'Cazador de demonios': '#A330C9',
  Druida: '#FF7C0A',
  Evocador: '#33937F',
  Cazador: '#AAD372',
  Mago: '#3FC7EB',
  Monje: '#00FF98',
  Paladín: '#F48CBA',
  Sacerdote: '#FFFFFF',
  Pícaro: '#FFF468',
  Chamán: '#0070DD',
  Brujo: '#8788EE',
  Guerrero: '#C69B6D',
};

export const main = {
  name: 'Tunombre',
  title: 'el Incansable',
  realm: 'Sanguino',
  region: 'EU',
  faction: 'Horda', // 'Horda' o 'Alianza'
  guild: 'Tu Hermandad',
  className: 'Paladín',
  spec: 'Protección',
  race: 'Elfo de sangre',
  tagline: 'Tanque de Mítica+, aficionado a las bandas y coleccionista de monturas.',
  stats: [
    { label: 'Nivel de objeto', value: '678' },
    { label: 'Puntuación M+', value: '3150' },
    { label: 'Banda', value: '8/8 H' },
    { label: 'Logros', value: '24 310' },
  ],
};

export const characters = [
  { ...main, role: 'Tanque', level: 80, ilvl: 678 },
  { name: 'Alter', className: 'Mago', spec: 'Fuego', role: 'DPS', level: 80, ilvl: 664 },
  { name: 'Otroalter', className: 'Sacerdote', spec: 'Disciplina', role: 'Sanador', level: 80, ilvl: 659 },
  { name: 'Tercero', className: 'Cazador de demonios', spec: 'Devastación', role: 'DPS', level: 80, ilvl: 641 },
];

// difficulty: 'N' | 'H' | 'M'
export const raids = [
  { name: 'Banda actual', killed: 8, total: 8, difficulty: 'H' },
  { name: 'Banda actual', killed: 3, total: 8, difficulty: 'M' },
];

export const highlights = [
  { label: 'Gloria del Héroe', quality: 'epic' },
  { label: 'Llave +15 en tiempo', quality: 'rare' },
  { label: 'Primer jefe en Mítico', quality: 'legendary' },
];

export const posts = [
  { tag: 'Guía', date: '2026-10-12', title: 'Mi ruta de Mítica+ esta temporada', excerpt: 'Cómo enfoco cada mazmorra como tanque y qué cambio según los afijos.' },
  { tag: 'Diario', date: '2026-10-03', title: 'Por fin: banda en heroico completa', excerpt: 'Crónica de la noche en la que la hermandad cerró el último jefe.' },
  { tag: 'Build', date: '2026-09-21', title: 'Talentos y estadísticas que uso', excerpt: 'Mi configuración actual explicada paso a paso.' },
];

export const links = [
  { label: 'Raider.IO', href: 'https://raider.io' },
  { label: 'Warcraft Logs', href: 'https://www.warcraftlogs.com' },
  { label: 'Discord', href: '#' },
];
