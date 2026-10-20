# wowweb
World Of Warcraft Personal website

Web hecha con [Astro](https://astro.build) y publicada en GitHub Pages:
https://cyclops12ad.github.io/wowweb/

## Uso

```bash
npm install      # solo la primera vez
npm run dev      # servidor local en http://localhost:4321/wowweb/
npm run build    # genera la versión final en dist/
```

Cada push a `main` publica la web automáticamente (`.github/workflows/deploy.yml`).
En los pull requests solo se comprueba que la build funciona.

## Estructura

```
src/pages/          una página por archivo (index.astro = portada)
src/layouts/        estructura común: <head>, cabecera y pie
src/styles/         estilos globales (responsive, modo claro/oscuro)
public/             imágenes y archivos estáticos
astro.config.mjs    configuración (URL y ruta base de GitHub Pages)
```
