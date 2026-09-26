# Piano: da Astro a un build statico con Bun

## Obiettivo

Sostituire Astro con un unico script TypeScript eseguito da Bun, **senza dipendenze npm**. Lo script trasforma i post markdown in HTML e produce un sito statico puro in `dist/`. La struttura del progetto viene semplificata perché lo script resti banale: **la cartella di un file indica già dove finirà nel sito**.

### Perché

- Negli ultimi 12 mesi 27 commit su 33 sono stati aggiornamenti di pacchetti.
- Il sito usa una minima parte di Astro:
  - 10 post, nessuno dei quali usa componenti MDX (li usa solo una bozza);
  - 3 layout e 4 componenti, cioè template HTML con qualche condizione;
  - immagini già in modalità passthrough, quindi solo copiate;
  - 140 righe di SCSS.
- Bun 1.3 include tutto il necessario: TypeScript nativo, `Bun.markdown`,
  `Bun.YAML`, `Bun.Glob`, `Bun.write`, `Bun.serve` e la modalità `--watch`.

## Confronto con lo status quo

| | Astro (oggi) | Script Bun |
|---|---|---|
| Dipendenze | ~300 transitive, lockfile da 160 KB | 0 |
| Manutenzione | aggiornamenti continui, una major all'anno | aggiornare Bun quando si vuole |
| Type checking | `astro check` | tipi nello script, controllati dall'editor |
| Dev server | HMR | rebuild in watch più live reload (SSE) |
| Evidenziazione del codice | Shiki | highlighter interno minimale |
| MDX / componenti nei post | sì | no: HTML grezzo dentro il markdown |
| Ottimizzazione immagini | disattivata comunque (passthrough) | copia diretta |
| Comprensibilità | framework con le sue convenzioni | un file di ~200 righe più template HTML |

### Pro

- Nessun Dependabot, nessuna scansione Snyk, nessun lockfile.
- I template sono HTML vero: si modificano senza conoscere né Astro né lo script.
- L'HTML e il CSS generati sono esattamente quelli scritti.
- Build istantaneo.

### Contro

- `Bun.markdown` è un'API recente: le versioni di Bun vanno fissate e gli aggiornamenti verificati.
- Il sito si può costruire solo con Bun installato.
- Si perdono MDX, l'HMR e il type checking automatico dei template.
- Funzioni come il feed RSS (previsto, ~30 righe) o l'ottimizzazione delle immagini vanno scritte a mano.
- Netlify supporta Bun, ma non è il runtime predefinito: serve configurarlo.
- Lo spostamento dei post da `/posts/` a `/blog/` richiede redirect permanenti (vedi sotto).

## URL: i post passano a `/blog/<slug>/`

Situazione verificata sul sito pubblicato (24/09/2026):

| URL | Stato |
|---|---|
| `/blog/` | 200 |
| `/posts/<slug>/` | 200: è qui che i post esistono oggi; sitemap e canonical puntano qui |
| `/blog/<slug>/` | **404**: i link della pagina `/blog/` sono rotti in produzione |
| `/posts/draft/<slug>/` | 200: **le bozze sono pubbliche** e una è anche nella sitemap |

Per passare a `/blog/<slug>/` senza rompere nulla:

- generare i post in `dist/blog/<slug>/index.html` (gli slug restano identici);
- aggiungere `public/_redirects` con `/posts/* /blog/:splat 301`, così i link esterni, i risultati di ricerca e i canonical dei cross-post continuano a funzionare;
- aggiornare canonical e sitemap a `/blog/<slug>/`;
- le vecchie URL delle bozze (`/posts/draft/*`) finiscono in 404, che è il comportamento voluto.

Questo sistema anche i link rotti della pagina `/blog/`.

## Nuova struttura del progetto

```
build.ts              # l'unico script: ~200 righe, highlighter incluso
dev.ts                # Bun.serve su dist/, rebuild in watch e live reload (SSE)
style.css             # unico foglio di stile, inserito inline in ogni pagina
templates/
  base.html           # shell: <head> con meta/OG, {{style}}, {{body}}
  header.html         # topbar con foto e icone SVG inline
  footer.html
  post.html           # corpo di un articolo: {{title}}, {{date}}, {{subtitle}}, {{content}}, …
  blog.html           # corpo dell'elenco: intro e {{posts}}
pages/                # frammenti HTML statici, avvolti in base.html
  index.html          #   → dist/index.html
  404.html            #   → dist/404.html
blog/                 # un file per post
  2025-08-23-naming-things.md   → dist/blog/2025-08-23-naming-things/index.html
drafts/               # mai pubblicate; visibili in locale con `bun build.ts --drafts`
public/               # copiato 1:1 in dist/
  _redirects
  images/me.webp, images/me_thumb.webp   # ex src/images/
  posts/*.jpg, favicon, manifest, robots.txt, …
netlify.toml
```

### Cosa sparisce rispetto a oggi

- `src/` e tutte le sue sottocartelle (`layouts`, `components`, `interfaces`,
  `pages/posts`).
- `astro.config.mjs`, `.astro/`, `tsconfig.json`, `pnpm-lock.yaml`,
  `pnpm-workspace.yaml`, `.prettierrc` con il plugin Astro.
- I componenti diventano template o spariscono:
  - `icon.astro` → gli SVG usati (mastodon, github) incollati direttamente in
    `header.html` e `pages/index.html`; le icone inutilizzate (twitter, devto,
    light, dark) si eliminano;
  - `article-date.astro` → una funzione di 5 righe in `build.ts`;
  - `custom-block.astro` → `<div class="custom-block">` scritto nel markdown.

### Frontmatter semplificato

La data e lo slug si ricavano dal nome del file (`YYYY-MM-DD-slug.md`) e il
canonical dallo slug. Il frontmatter perde quindi `layout`, `date` e
`canonicalUrl`:

```yaml
---
title: "Naming Things: …"
subtitle: …
description: …
tags: …
lastUpdate: 2025-09-01   # opzionale
---
```

`build.ts` controlla che `title` sia presente e si ferma con un errore chiaro
se manca.

### Template

Sono file HTML con segnaposti `{{nome}}`, sostituiti da una sola funzione:

```ts
const render = (tpl: string, vars: Record<string, string>) =>
  tpl.replace(/\{\{(\w+)\}\}/g, (_, k) => vars[k] ?? '');
```

- I valori testuali (titoli, descrizioni) passano da `escapeHtml()` prima di
  essere inseriti. Il contenuto del post e i blocchi già generati no.
- Le parti condizionali (sottotitolo, ultimo aggiornamento, canonical) si costruiscono in `build.ts` come stringa, vuota se il dato manca. Nessun linguaggio di template, niente `if` nei file HTML.
- Il ciclo dell'elenco post in `/blog/` produce `{{posts}}` con un template literal in `build.ts`.

### CSS

- Un solo `style.css` con nesting nativo e custom properties al posto delle variabili SCSS.
- Gli stili oggi isolati per componente (`data-astro-cid-*`) collidono una volta uniti: per esempio `main` e `footer` hanno regole diverse nelle pagine blog e post. Si risolve con una classe sul body (`<body class="{{page}}">`: `home`, `blog`, `post`, `not-found`) e selettori come `.post main { … }`.
- `build.ts` legge il file e lo inserisce in `<style>` nel `<head>`, come fa oggi Astro con `inlineStylesheets: 'always'`.

## Flusso di `build.ts`

1. Svuotare `dist/` e copiare `public/`.
2. Leggere `style.css` e i template.
3. Per ogni `blog/*.md` (più `drafts/*.md` con `--drafts`):
   1. separare il frontmatter e passarlo a `Bun.YAML.parse`;
   2. ricavare data e slug dal nome del file;
   3. convertire il corpo con `Bun.markdown.html()` ed evidenziare il codice;
   4. scrivere il file `dist/blog/<slug>/index.html`.
4. Ordinare i post per data decrescente e generare `dist/blog/index.html`.
5. Avvolgere `pages/*.html` in `base.html`.
6. Scrivere `sitemap-index.xml` e `sitemap-0.xml` con home, `/blog/` e i post pubblicati.
7. Scrivere `feed.xml` con gli ultimi post pubblicati.
8. Solo in modalità `dev`: iniettare lo script di live reload nelle pagine (vedi sotto).

## Evidenziazione della sintassi (sostituto di Shiki)

**Si può reimplementare nel builder.** Solo un post ha codice (due blocchi `ts` in `2022-01-02-finding-home`), quindi basta un highlighter minimale.

### Approccio verificato con Bun 1.3.9

- `Bun.markdown.render()` accetta callback per ogni nodo (la callback `code` riceve il linguaggio), ma i nodi senza callback perdono il loro HTML. Non conviene usarlo solo per il codice.
- `Bun.markdown.html()` produce `<pre><code class="language-ts">…</code></pre>`. Si fa quindi un **post-processing dell'HTML**:
  1. regex sui blocchi `<pre><code class="language-(\w+)">([\s\S]*?)</code></pre>`;
  2. decodifica delle entità HTML del contenuto;
  3. tokenizzazione ed escape di nuovo;
  4. sostituzione con `<pre class="code" data-lang="ts"><code>…<span class="tok-kw">const</span>…</code></pre>`.

### Tokenizer (~60 righe dentro `build.ts`)

Uno scanner a singola passata con regex sticky (`/y`) in ordine di priorità:

1. commenti (`//…`, `/* … */`)
2. stringhe e template literal (`'…'`, `"…"`, `` `…` ``)
3. numeri
4. keyword (`const`, `let`, `await`, `async`, `function`, `return`, `new`,
   `import`, `from`, `export`, `if`, `else`, `for`, `of`, `type`, `interface`, …)
5. chiamate di funzione (`identificatore` seguito da `(`)
6. tutto il resto come testo semplice

- Linguaggi sconosciuti o assenti: solo escape, nessun colore.
- Colori definiti come custom properties in `style.css`, con varianti per `prefers-color-scheme: dark`.
- Se servirà un nuovo linguaggio, basterà aggiungere le sue keyword.

## Passi di migrazione

1. **Branch** `bun-static-build`.
2. **Snapshot di riferimento**: salvare il `dist/` attuale prodotto da Astro
   per il confronto finale.
3. **Spostamenti**:
   - `src/pages/posts/*.mdx` → `blog/*.md`;
   - `src/pages/posts/draft/*` → `drafts/`;
   - `src/images/*` → `public/images/`.
4. **Frontmatter**: rimuovere `layout`, `date` e `canonicalUrl`. Nella bozza
   `003`, sostituire `<CustomBlock>` con `<div class="custom-block">`.
5. **Template**: copiare l'HTML generato da Astro in `dist/` (già privo di sintassi Astro), ripulirlo dagli attributi `data-astro-cid-*` e inserire i segnaposti.
6. **CSS**: unire `main.scss` e gli stili dei componenti in `style.css`, convertire lo SCSS e aggiungere i prefissi di pagina.
7. **`build.ts`**: flusso sopra più highlighter.
8. **`dev.ts`**: `Bun.serve` statico su `dist/`, `fs.watch` sulle cartelle sorgente e live reload via SSE. Verificare che `bun build.ts` non contenga `__reload` in nessun file di `dist/`.
   Nello stesso passo, aggiungere il feed RSS a `build.ts` e il `<link rel="alternate">` in `base.html`.
9. **Redirect**: `public/_redirects` con `/posts/* /blog/:splat 301`.
10. **Verifica**:
    - `diff` dell'HTML normalizzato con lo snapshot, al netto di URL e attributi Astro;
    - controllo visivo di home, blog, un post con codice e 404, in tema chiaro e scuro;
    - `curl -I` sulle vecchie URL `/posts/<slug>/` della deploy preview per confermare i 301.
11. **Pulizia**:
    - rimuovere i file di Astro e pnpm elencati sopra e la skill `update-packages`;
    - ridurre `package.json` ai soli script (`build`, `dev`);
    - aggiornare `AGENTS.md` e `README.md`;
    - cambiare il link "Build with Astro" nel footer.
12. **Deploy**: `netlify.toml` con `command = "bun build.ts"`,
    `publish = "dist"` e `BUN_VERSION` fissata. Verificare su una deploy
    preview prima del merge.

## Bug esistenti risolti dalla migrazione

- **Bozze pubblicate e presenti nella sitemap**: stanno fuori da `blog/` e
  sono escluse dal build di produzione.
- **Link rotti** da `/blog/` a `/blog/<slug>/`: diventano le URL reali dei
  post.
- **Ordinamento rotto** in `blog.astro`: confronta
  `p1.frontmatter.date > p1.frontmatter.date`.

## Feed RSS

Deciso: si aggiunge. Il feed è generato da `build.ts` con i dati già raccolti per l'elenco dei post (~30 righe, nessuna dipendenza).

- Output: `dist/feed.xml` (RSS 2.0), con i post pubblicati in ordine di data decrescente (gli ultimi 20).
- Ogni `<item>`: `title`, `link` (`/blog/<slug>/`), `guid` (stessa URL, `isPermaLink="true"`), `pubDate` (RFC 822, da `Date.toUTCString()`), `description` (dal frontmatter). Il testo passa da `escapeHtml()`.
- Il contenuto completo può andare in `<content:encoded>` dentro `CDATA`, con il namespace `xmlns:content`. Per cominciare basta la descrizione.
- Autodiscovery: `base.html` aggiunge `<link rel="alternate" type="application/rss+xml" title="…" href="/feed.xml">`.
- Le bozze non entrano mai nel feed, nemmeno con `--drafts`.
- Il sito base (`https://…`) è una costante in cima a `build.ts`, condivisa con sitemap e canonical.

## Sviluppo e rilascio: due modalità, un solo build

`build.ts` esporta una funzione `build({ drafts, dev })` e, se eseguito direttamente, la chiama una volta (`bun build.ts`). `dev.ts` la importa: non c'è codice duplicato tra sviluppo e produzione.

| | `bun run dev` | `bun run build` (Netlify) |
|---|---|---|
| Comando | `bun dev.ts` | `bun build.ts` |
| Bozze | incluse | escluse |
| Output | `dist/` (ricostruito a ogni modifica) | `dist/` (pulito) |
| Live reload | sì, script iniettato | no |
| `feed.xml` e sitemap | generati | generati |
| Server | `Bun.serve` su `localhost:3000` | nessuno |

Il build di produzione resta quindi quello descritto nel flusso sopra: nessuna modifica dello script di reload finisce in `dist/` per il rilascio.

### Live reload (Server-Sent Events)

Deciso: live reload al posto del reload manuale, ~40 righe in `dev.ts`.

1. `dev.ts` esegue `build({ drafts: true, dev: true })` all'avvio.
2. `Bun.serve` serve i file di `dist/` (`/blog/x/` → `dist/blog/x/index.html`, 404 con `dist/404.html`) e un endpoint `/__reload` che apre uno stream `text/event-stream` e tiene i client in un `Set`.
3. Con `dev: true` il build aggiunge prima di `</body>` un piccolo script, mai presente con `dev: false`:
   ```html
   <script>new EventSource('/__reload').onmessage = () => location.reload()</script>
   ```
4. `fs.watch(dir, { recursive: true })` su `blog/`, `drafts/`, `pages/`, `templates/`, `public/` e su `style.css`, con debounce di ~50 ms. Su ogni evento: rebuild, poi un messaggio `data: reload` a tutti i client.
5. Se il rebuild fallisce (per esempio un `title` mancante) l'errore va nel terminale, `dist/` resta com'era e il browser non si ricarica.
6. Il rebuild è completo (il build è istantaneo con 10 post), quindi non serve tracciare le dipendenze.
7. Solo `style.css` cambia spesso: si può migliorare in seguito con un reload del solo foglio di stile, ma non serve subito.

`package.json` contiene solo:

```json
{ "scripts": { "dev": "bun dev.ts", "build": "bun build.ts" } }
```
