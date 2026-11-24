# Ca n'Aleix · web (vista previa)

Web estática bilingüe (catalán / castellano) para **Ca n'Aleix**, casa pairal del siglo XV en Verdú (Urgell), y su casa hermana **L'Era de Cal Roger**.

Esto es una **vista previa de diseño**: las fotos son de stock (Pexels) y el formulario no envía nada. Lo que queda pendiente para la versión definitiva está en [Para pasar a producción](#para-pasar-a-producción).

## Cómo funciona

```text
content/
  site.json      ← datos comunes: capacidad, precio, horarios, contacto, fotos, lugares…
  ca.json        ← textos en catalán (idioma por defecto, en /)
  es.json        ← textos en castellano (en /es/)
src/
  templates/     ← plantillas HTML (funciones JS, sin dependencias)
  assets/        ← CSS, JS e iconos SVG separados
build.mjs        ← generador estático: content + templates → dist/
scripts/check.mjs← control de calidad del HTML generado
.github/workflows/deploy.yml ← build + check + publicación en GitHub Pages
```

Cada dato existe **una sola vez**. El precio, los horarios, la capacidad o las distancias se cambian en `content/site.json`, y el build los lleva a todos los sitios donde aparecen (la web, el JSON-LD y la validación del formulario). Los textos de cada idioma están en su JSON. Si a un idioma le falta un texto que los datos necesitan, el build falla y dice cuál es.

```bash
npm run build   # genera dist/
npm run check   # pasa el control de calidad sobre dist/
npm run serve   # sirve dist/ en http://localhost:8080
```

Hace falta Node 20 o superior. No hay dependencias que instalar.

## Despliegue

En cada push a `main`, GitHub Actions ejecuta `build` y `check`. Si pasan, publica `dist/` en GitHub Pages; si `check` falla, no se publica nada.

En el repositorio: **Settings → Pages → Source: GitHub Actions**.

La URL pública está en `content/site.json` (`siteUrl`). También se puede sobreescribir con la variable `SITE_URL` en el build.

## Decisiones técnicas

| Tema | Qué se ha hecho |
| --- | --- |
| Arquitectura | Contenido en JSON y generador estático propio. Nada de contenido escrito a mano en el HTML ni repetido. |
| Build | CSS y JS en archivos separados. El CSS se minifica en el build y los assets llevan hash en el nombre para la caché. El check se ejecuta en CI. |
| Semántica | `<main>` único, un `h1` por página, títulos sin saltos de nivel, nav construido con listas, `<address>`, `<dialog>`, `<details>`. |
| CSS | Solo selectores de clase (no se estilan `section`, `form`, `label` ni `nav` de forma global) y ningún `style=""`. |
| CSP | Sin `onclick`/`onerror` inline ni scripts ejecutables inline. CSP sin `unsafe-inline`. |
| Hero | `min-height: 92svh` (con `vh` de respaldo). Imagen con `fetchpriority="high"`, `srcset` y tamaño explícito. No hay valores mágicos que dependan de la altura de otros elementos. |
| Imágenes | Todas con `width`/`height` (sin CLS), `srcset`/`sizes`, `loading="lazy"` y `alt` descriptivo en los dos idiomas. |
| Formulario | `name`/`id`/`label for` en todos los campos, `type="tel"` y `autocomplete`. Las fechas tienen `min` igual a hoy y la salida tiene que ser posterior a la entrada. Se comprueba la capacidad de la casa elegida y hay casilla de privacidad obligatoria. Los errores se anuncian con `aria-live`. Sin JS, el navegador valida y el formulario se envía por `mailto:`. |
| Accesibilidad | Enlace para saltar al contenido. Pestañas con `role="tab"`, `aria-selected` y teclado (flechas, Inicio, Fin). Menú con `aria-expanded`. Lightbox navegable con teclado que devuelve el foco al cerrar. Se respeta `prefers-reduced-motion`. |
| Sin JS | Todo el contenido se ve. Las animaciones de entrada solo se aplican si hay JS y el usuario no ha pedido reducir el movimiento. |
| SEO | Canonical, `hreflang` (ca, es, x-default), Open Graph, JSON-LD `LodgingBusiness`, `sitemap.xml` con alternativas de idioma, favicon SVG y 404 propia. |
| RGPD/LSSI | Fuentes del sistema, sin Google Fonts. Sin analítica ni cookies. El mapa (OpenStreetMap) solo se carga cuando el visitante lo pide. Aviso legal, privacidad y cookies enlazados desde todas las páginas. |

## Para pasar a producción

- [ ] **Fotos reales** de la casa en `src/assets/img/`, servidas desde el mismo dominio. Hay que cambiar el catálogo `images` de `site.json` y quitar `images.pexels.com` de la CSP. Si cambia la lista `gallery`, hay que revisar `grid-template-areas` en `main.css`.
- [ ] **Formulario**: conectarlo a un endpoint (Formspree, Netlify Forms o un script propio) y añadir ese dominio a `form-action` en la CSP.
- [ ] **Datos que hay que confirmar con el propietario**: horarios de entrada y salida, precio desde 33 €, piscina (sale en las opiniones pero no en la ficha), distribución exacta de los dormitorios y datos de L'Era de Cal Roger.
- [ ] **Titular legal** (nombre/razón social y NIF) en los textos legales de `ca.json` y `es.json`.
- [ ] **Dominio propio** (p. ej. canaleix.es): actualizar `siteUrl` y poner `indexable: true` para que Google la indexe. Ahora mismo la vista previa lleva `noindex`.

## Créditos

Fotografías de vista previa: [Pexels](https://www.pexels.com) (licencia Pexels). Los textos de las opiniones son resúmenes de reseñas públicas en Escapada Rural.
