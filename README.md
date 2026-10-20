# wowweb
World Of Warcraft Personal website

Web hecha con [Astro](https://astro.build) y publicada en GitHub Pages:
https://cyclops12ad.github.io/wowweb/

## Uso

```bash
npm install      # solo la primera vez
npm run dev      # servidor local en http://localhost:4321/wowweb/
npm run build    # genera la versión final en dist/
npm test         # tests de la lógica (también se ejecutan en cada PR)
```

Cada push a `main` publica la web automáticamente (`.github/workflows/deploy.yml`),
y cada día a las 06:00 UTC se vuelve a generar para refrescar los datos de Raider.IO.
La build necesita conexión a internet: si Raider.IO no responde, falla y sigue publicada la versión anterior.
En los pull requests solo se comprueba que la build funciona.

## Flujo de trabajo

- `main` está protegida: solo se cambia mediante PR, y el PR no se puede fusionar hasta que la comprobación `build` pasa.
- Los PR pueden marcarse con fusión automática: GitHub los fusiona (y borra la rama) en cuanto la build pasa.
- Dependabot abre cada semana un PR si hay versiones nuevas de las acciones del workflow o de Astro.

## Estructura

```
src/pages/          una página por archivo (index.astro = portada, grupos.astro = planificador)
src/scripts/        JavaScript del navegador; grupos-core.js tiene la lógica del planificador y sus tests
src/layouts/        estructura común: <head>, cabecera y pie
src/components/     una sección por archivo, con sus propios estilos
src/data/perfil.js  qué personajes mostrar, frase, entradas y enlaces (edita aquí)
src/data/raiderio.js lee clase, iLvl, M+ y bandas de Raider.IO al generar la web
src/data/es.js      traducciones al español y colores de clase
src/styles/         colores, tipografía y piezas comunes (botones, paneles…)
public/             imágenes y archivos estáticos
astro.config.mjs    configuración (URL y ruta base de GitHub Pages)
```
