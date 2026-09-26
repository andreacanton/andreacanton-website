# TODO: Migrare da Astro a un build statico con Bun (zero dipendenze)

Issue: [#136](https://github.com/andreacanton/andreacanton-website/issues/136)

Piano di dettaglio: [`piano-migrazione-bun.md`](./piano-migrazione-bun.md)

Ogni fase corrisponde a un'onda del workflow agentico: i task di una stessa fase non dipendono tra loro e possono girare in parallelo, salvo dove indicato.

## Fase 1: Preparazione

- [x] **T1.1 · Snapshot di riferimento del sito Astro**
  - Complessità: low
  - Descrizione: Eseguire `pnpm build` sul sito attuale e salvare il `dist/` prodotto da Astro fuori dal repository, per il confronto finale.
  - File toccati: nessuno nel repository (snapshot fuori dal repo)
  - Acceptance: Lo snapshot contiene home, `/blog/`, tutti i post, 404 e sitemap, ed è accessibile per il `diff` della fase 6.
  - Dipende da: nessuno
- [x] **T1.2 · Fissare la versione di Bun**
  - Complessità: low
  - Descrizione: Scegliere la versione di Bun 1.3.x (fissata: 1.3.9, la 1.3.0 non ha `Bun.markdown`) su cui sviluppare e verificare che `Bun.markdown`, `Bun.YAML`, `Bun.serve` e `fs.watch` ricorsivo si comportino come descritto nel piano.
  - File toccati: nessuno (la versione viene annotata e poi usata in T7.3)
  - Acceptance: Versione annotata e usata in locale, con una prova rapida di `Bun.markdown.html()` su un post reale.
  - Dipende da: nessuno
- [x] **T1.3 · Redirect delle vecchie URL**
  - Complessità: low
  - Descrizione: Aggiungere `public/_redirects` con `/posts/* /blog/:splat 301`.
  - File toccati: `public/_redirects`
  - Acceptance: Il file esiste in `public/`, così verrà copiato in `dist/` dal build.
  - Dipende da: nessuno

## Fase 2: Contenuti e template

- [x] **T2.1 · Spostare post, bozze e immagini**
  - Complessità: low
  - Descrizione: `src/pages/posts/*.mdx` → `blog/*.md`, `src/pages/posts/draft/*` → `drafts/`, `src/images/*` → `public/images/`. Gli slug restano identici.
  - File toccati: `src/pages/posts/`, `src/images/`, `blog/`, `drafts/`, `public/images/`
  - Acceptance: Ogni post ha nome `YYYY-MM-DD-slug.md` in `blog/`, le bozze sono in `drafts/`, le immagini in `public/images/`.
  - Dipende da: T1.1
- [x] **T2.2 · Template HTML**
  - Complessità: medium
  - Descrizione: Partendo dall'HTML generato da Astro nello snapshot, creare `templates/base.html`, `header.html`, `footer.html`, `post.html`, `blog.html` e `pages/index.html`, `pages/404.html`. Rimuovere gli attributi `data-astro-cid-*`, inserire i segnaposti `{{nome}}` e la classe `{{page}}` sul body. Incollare inline gli SVG usati (mastodon, github) ed eliminare le icone inutilizzate. Aggiungere `<link rel="alternate" type="application/rss+xml">` in `base.html`.
  - File toccati: `templates/`, `pages/`
  - Acceptance: I template non contengono sintassi Astro né condizioni, e coprono tutte le pagine attuali.
  - Dipende da: T1.1

## Fase 3: Frontmatter e stili

- [x] **T3.1 · Semplificare il frontmatter**
  - Complessità: low
  - Descrizione: Rimuovere `layout`, `date` e `canonicalUrl` da post e bozze. Nella bozza `003` sostituire `<CustomBlock>` con `<div class="custom-block">`.
  - File toccati: `blog/*.md`, `drafts/*.md`
  - Acceptance: Il frontmatter contiene solo `title`, `subtitle`, `description`, `tags`, `lastUpdate`, e nessun file contiene sintassi MDX.
  - Dipende da: T2.1
- [x] **T3.2 · Unico `style.css`**
  - Complessità: medium
  - Descrizione: Unire `main.scss` e gli stili dei componenti in `style.css`, con nesting nativo e custom properties. Risolvere le collisioni con selettori di pagina (`.home`, `.blog`, `.post`, `.not-found`). Aggiungere i colori dell'highlighter per tema chiaro e scuro.
  - File toccati: `style.css`
  - Acceptance: Nessun SCSS residuo e nessuna regola che dipende da `data-astro-cid-*`.
  - Dipende da: T2.2

## Fase 4: Nucleo del build

Le fasi successive si appoggiano a questo file: il task va completato prima di lanciare la fase 5.

- [x] **T4.1 · Nucleo di `build.ts`**
  - Complessità: medium
  - Descrizione: Esportare `build({ drafts, dev })`: svuotare `dist/`, copiare `public/`, leggere template e CSS, `render()` ed `escapeHtml()`, parsing del frontmatter con `Bun.YAML`, data e slug dal nome file, errore chiaro se manca `title`, scrittura di `dist/blog/<slug>/index.html`, elenco `/blog/` ordinato per data decrescente, pagine statiche avvolte in `base.html`. Se eseguito direttamente, chiama `build()` una volta (`--drafts` abilita le bozze).
  - File toccati: `build.ts`
  - Acceptance: `bun build.ts` genera home, `/blog/`, post e 404 senza `node_modules`. Le bozze non sono in `dist/` senza `--drafts`. Un post senza `title` ferma il build con un messaggio chiaro.
  - Dipende da: T2.2, T3.1, T3.2

## Fase 5: Funzionalità del build

T5.1 e T5.2 vivono in moduli separati (`highlight.ts`, `dev.ts`) e girano in parallelo. T5.3 e T5.4 modificano entrambi `build.ts`, quindi vanno affidati allo stesso agente.

- [x] **T5.1 · Highlighter del codice**
  - Complessità: medium
  - Descrizione: Modulo `highlight.ts` agganciato a `build.ts`: post-processing dei blocchi `<pre><code class="language-…">` prodotti da `Bun.markdown.html()`, con decodifica delle entità, tokenizer a singola passata con regex sticky (commenti, stringhe, numeri, keyword, chiamate) e nuovo escape. Solo `ts` per ora, altri linguaggi solo con escape.
  - File toccati: `highlight.ts`, `build.ts` (solo l'aggancio)
  - Acceptance: Il post `2022-01-02-finding-home` mostra il codice colorato in tema chiaro e scuro, e un blocco senza linguaggio resta leggibile e correttamente escapato.
  - Dipende da: T4.1
- [x] **T5.2 · `dev.ts` con live reload**
  - Complessità: medium
  - Descrizione: `build({ drafts: true, dev: true })` all'avvio, `Bun.serve` statico su `dist/` con fallback a `404.html`, endpoint SSE `/__reload`, `fs.watch` ricorsivo su `blog/`, `drafts/`, `pages/`, `templates/`, `public/` e `style.css` con debounce. Lo script di reload viene iniettato solo con `dev: true`.
  - File toccati: `dev.ts`
  - Acceptance: Ogni modifica supportata ricarica il browser. Se il rebuild fallisce, l'errore appare nel terminale, `dist/` resta com'era e il browser non si ricarica. `bun build.ts` non produce nessun file con `__reload`.
  - Dipende da: T4.1
- [x] **T5.3 · Sitemap**
  - Complessità: low
  - Descrizione: Scrivere `sitemap-index.xml` e `sitemap-0.xml` con home, `/blog/` e i post pubblicati, usando la costante del sito base. Canonical dei post su `/blog/<slug>/`.
  - File toccati: `build.ts`
  - Acceptance: La sitemap non contiene bozze, nemmeno con `--drafts`, e tutti i link puntano a `/blog/<slug>/`.
  - Dipende da: T4.1
- [x] **T5.4 · Feed RSS**
  - Complessità: low
  - Descrizione: Generare `dist/feed.xml` (RSS 2.0) con gli ultimi 20 post pubblicati: `title`, `link`, `guid`, `pubDate`, `description`, testi passati da `escapeHtml()`.
  - File toccati: `build.ts`
  - Acceptance: Il feed supera un validatore RSS e non contiene bozze, nemmeno con `--drafts`.
  - Dipende da: T4.1

## Fase 6: Verifica

- [x] **T6.1 · Confronto con lo snapshot**
  - Complessità: medium
  - Descrizione: `diff` dell'HTML normalizzato di `dist/` con lo snapshot Astro.
  - File toccati: nessuno (solo lettura; eventuali correzioni tornano ai task di origine)
  - Acceptance: Le uniche differenze sono URL e attributi Astro, più quelle previste dalla issue (feed, redirect, bug corretti).
  - Dipende da: T1.1, T4.1, T5.1, T5.3, T5.4
- [x] **T6.2 · Controllo visivo**
  - Complessità: low
  - Descrizione: Controllare home, `/blog/`, un post con codice e la 404, in tema chiaro e scuro.
  - File toccati: nessuno
  - Acceptance: Nessuna regressione visiva o di accessibilità rispetto al sito attuale.
  - Dipende da: T6.1

## Fase 7: Pulizia e deploy

- [x] **T7.1 · Rimuovere Astro e pnpm**
  - Complessità: low
  - Descrizione: Eliminare `src/`, `astro.config.mjs`, `.astro/`, `tsconfig.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`, il plugin Astro di Prettier e la skill `update-packages`. Ridurre `package.json` ai soli script `build` e `dev`.
  - File toccati: `src/`, `astro.config.mjs`, `.astro/`, `tsconfig.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`, `package.json`, configurazione Prettier, skill `update-packages`
  - Acceptance: Nessun `node_modules` né lockfile necessario, e `bun build.ts` funziona da un clone pulito.
  - Dipende da: T6.2
- [x] **T7.2 · Documentazione e footer**
  - Complessità: low
  - Descrizione: Aggiornare `AGENTS.md` e `README.md` (comandi, struttura, versione di Bun) e sostituire il link "Build with Astro" nel footer.
  - File toccati: `AGENTS.md`, `README.md`, `templates/footer.html`
  - Acceptance: La documentazione descrive solo il nuovo flusso e il footer non cita più Astro.
  - Dipende da: T7.1
- [x] **T7.3 · Configurazione Netlify**
  - Complessità: low
  - Descrizione: `netlify.toml` con `command = "bun build.ts"`, `publish = "dist"` e `BUN_VERSION` fissata.
  - File toccati: `netlify.toml`
  - Acceptance: La deploy preview viene costruita con successo.
  - Dipende da: T1.2, T7.1
- [x] **T7.4 · Verifica sulla deploy preview**
  - Complessità: low
  - Descrizione: `curl -I` sulle vecchie URL e controllo di sitemap e feed pubblicati.
  - File toccati: nessuno
  - Acceptance: `/posts/<slug>/` risponde 301 verso `/blog/<slug>/` (nessuna regola dedicata per `/posts/draft/*`), sitemap e feed non contengono bozze.
  - Dipende da: T1.3, T7.3

## Rollout

Da aggiornare a ogni task completato.

- Task totali: 18
- Fatti: 18
- Da fare: 0
- Fase corrente: 7 · Pulizia e deploy
- Prossimo task: nessuno
