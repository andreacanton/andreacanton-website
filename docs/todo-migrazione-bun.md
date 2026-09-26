# TODO: Migrare da Astro a un build statico con Bun (zero dipendenze)

Issue: [#136](https://github.com/andreacanton/andreacanton-website/issues/136)

Piano di dettaglio: [`piano-migrazione-bun.md`](./piano-migrazione-bun.md)

## Fase 1: Preparazione

- [ ] **T1.1 · Snapshot di riferimento del sito Astro**
  - Complessità: bassa
  - Descrizione: Eseguire `pnpm build` sul sito attuale e salvare il `dist/` prodotto da Astro fuori dal repository, per il confronto finale.
  - Acceptance: Lo snapshot contiene home, `/blog/`, tutti i post, 404 e sitemap, ed è accessibile per il `diff` della fase 5.
  - Dipendenze: nessuna
- [ ] **T1.2 · Fissare la versione di Bun**
  - Complessità: bassa
  - Descrizione: Scegliere la versione di Bun 1.3.x su cui sviluppare e verificare che `Bun.markdown`, `Bun.YAML`, `Bun.serve` e `fs.watch` ricorsivo si comportino come descritto nel piano.
  - Acceptance: Versione annotata e usata in locale, con una prova rapida di `Bun.markdown.html()` su un post reale.
  - Dipendenze: nessuna

## Fase 2: Contenuti e struttura

- [ ] **T2.1 · Spostare post, bozze e immagini**
  - Complessità: bassa
  - Descrizione: `src/pages/posts/*.mdx` → `blog/*.md`, `src/pages/posts/draft/*` → `drafts/`, `src/images/*` → `public/images/`. Gli slug restano identici.
  - Acceptance: Ogni post ha nome `YYYY-MM-DD-slug.md` in `blog/`, le bozze sono in `drafts/`, le immagini in `public/images/`.
  - Dipendenze: T1.1
- [ ] **T2.2 · Semplificare il frontmatter**
  - Complessità: bassa
  - Descrizione: Rimuovere `layout`, `date` e `canonicalUrl` da post e bozze. Nella bozza `003` sostituire `<CustomBlock>` con `<div class="custom-block">`.
  - Acceptance: Il frontmatter contiene solo `title`, `subtitle`, `description`, `tags`, `lastUpdate`, e nessun file contiene sintassi MDX.
  - Dipendenze: T2.1
- [ ] **T2.3 · Redirect delle vecchie URL**
  - Complessità: bassa
  - Descrizione: Aggiungere `public/_redirects` con `/posts/* /blog/:splat 301`.
  - Acceptance: Il file esiste e viene copiato in `dist/` dal build.
  - Dipendenze: nessuna

## Fase 3: Template e CSS

- [ ] **T3.1 · Template HTML**
  - Complessità: media
  - Descrizione: Partendo dall'HTML generato da Astro nello snapshot, creare `templates/base.html`, `header.html`, `footer.html`, `post.html`, `blog.html` e `pages/index.html`, `pages/404.html`. Rimuovere gli attributi `data-astro-cid-*`, inserire i segnaposti `{{nome}}` e la classe `{{page}}` sul body. Incollare inline gli SVG usati (mastodon, github) ed eliminare le icone inutilizzate.
  - Acceptance: I template non contengono sintassi Astro né condizioni, e coprono tutte le pagine attuali.
  - Dipendenze: T1.1
- [ ] **T3.2 · Unico `style.css`**
  - Complessità: media
  - Descrizione: Unire `main.scss` e gli stili dei componenti in `style.css`, con nesting nativo e custom properties. Risolvere le collisioni con selettori di pagina (`.home`, `.blog`, `.post`, `.not-found`). Aggiungere i colori dell'highlighter per tema chiaro e scuro.
  - Acceptance: Nessun SCSS residuo e nessuna regola che dipende da `data-astro-cid-*`.
  - Dipendenze: T3.1

## Fase 4: Build e sviluppo

- [ ] **T4.1 · Nucleo di `build.ts`**
  - Complessità: media
  - Descrizione: Esportare `build({ drafts, dev })`: svuotare `dist/`, copiare `public/`, leggere template e CSS, `render()` ed `escapeHtml()`, parsing del frontmatter con `Bun.YAML`, data e slug dal nome file, errore chiaro se manca `title`, scrittura di `dist/blog/<slug>/index.html`, elenco `/blog/` ordinato per data decrescente, pagine statiche avvolte in `base.html`. Se eseguito direttamente, chiama `build()` una volta (`--drafts` abilita le bozze).
  - Acceptance: `bun build.ts` genera home, `/blog/`, post e 404 senza `node_modules`. Le bozze non sono in `dist/` senza `--drafts`. Un post senza `title` ferma il build con un messaggio chiaro.
  - Dipendenze: T2.2, T3.1, T3.2
- [ ] **T4.2 · Highlighter del codice**
  - Complessità: media
  - Descrizione: Post-processing dei blocchi `<pre><code class="language-…">` prodotti da `Bun.markdown.html()`: decodifica delle entità, tokenizer a singola passata con regex sticky (commenti, stringhe, numeri, keyword, chiamate), nuovo escape. Solo `ts` per ora, altri linguaggi solo con escape.
  - Acceptance: Il post `2022-01-02-finding-home` mostra il codice colorato in tema chiaro e scuro, e un blocco senza linguaggio resta leggibile e correttamente escapato.
  - Dipendenze: T4.1
- [ ] **T4.3 · Sitemap**
  - Complessità: bassa
  - Descrizione: Scrivere `sitemap-index.xml` e `sitemap-0.xml` con home, `/blog/` e i post pubblicati, usando la costante del sito base. Canonical dei post su `/blog/<slug>/`.
  - Acceptance: La sitemap non contiene bozze, nemmeno con `--drafts`, e tutti i link puntano a `/blog/<slug>/`.
  - Dipendenze: T4.1
- [ ] **T4.4 · Feed RSS**
  - Complessità: bassa
  - Descrizione: Generare `dist/feed.xml` (RSS 2.0) con gli ultimi 20 post pubblicati: `title`, `link`, `guid`, `pubDate`, `description`, testi passati da `escapeHtml()`. Aggiungere `<link rel="alternate" type="application/rss+xml">` in `base.html`.
  - Acceptance: Il feed supera un validatore RSS e non contiene bozze, nemmeno con `--drafts`.
  - Dipendenze: T4.1
- [ ] **T4.5 · `dev.ts` con live reload**
  - Complessità: media
  - Descrizione: `build({ drafts: true, dev: true })` all'avvio, `Bun.serve` statico su `dist/` con fallback a `404.html`, endpoint SSE `/__reload`, `fs.watch` ricorsivo su `blog/`, `drafts/`, `pages/`, `templates/`, `public/` e `style.css` con debounce. Lo script di reload viene iniettato solo con `dev: true`.
  - Acceptance: Ogni modifica supportata ricarica il browser. Se il rebuild fallisce, l'errore appare nel terminale, `dist/` resta com'era e il browser non si ricarica. `bun build.ts` non produce nessun file con `__reload`.
  - Dipendenze: T4.1

## Fase 5: Verifica

- [ ] **T5.1 · Confronto con lo snapshot**
  - Complessità: media
  - Descrizione: `diff` dell'HTML normalizzato di `dist/` con lo snapshot Astro.
  - Acceptance: Le uniche differenze sono URL e attributi Astro, più quelle previste dalla issue (feed, redirect, bug corretti).
  - Dipendenze: T1.1, T4.1, T4.2, T4.3, T4.4
- [ ] **T5.2 · Controllo visivo**
  - Complessità: bassa
  - Descrizione: Controllare home, `/blog/`, un post con codice e la 404, in tema chiaro e scuro.
  - Acceptance: Nessuna regressione visiva o di accessibilità rispetto al sito attuale.
  - Dipendenze: T5.1

## Fase 6: Pulizia e deploy

- [ ] **T6.1 · Rimuovere Astro e pnpm**
  - Complessità: bassa
  - Descrizione: Eliminare `src/`, `astro.config.mjs`, `.astro/`, `tsconfig.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`, il plugin Astro di Prettier e la skill `update-packages`. Ridurre `package.json` ai soli script `build` e `dev`.
  - Acceptance: Nessun `node_modules` né lockfile necessario, e `bun build.ts` funziona da un clone pulito.
  - Dipendenze: T5.2
- [ ] **T6.2 · Documentazione e footer**
  - Complessità: bassa
  - Descrizione: Aggiornare `AGENTS.md` e `README.md` (comandi, struttura, versione di Bun) e sostituire il link "Build with Astro" nel footer.
  - Acceptance: La documentazione descrive solo il nuovo flusso e il footer non cita più Astro.
  - Dipendenze: T6.1
- [ ] **T6.3 · Configurazione Netlify**
  - Complessità: bassa
  - Descrizione: `netlify.toml` con `command = "bun build.ts"`, `publish = "dist"` e `BUN_VERSION` fissata.
  - Acceptance: La deploy preview viene costruita con successo.
  - Dipendenze: T1.2, T6.1
- [ ] **T6.4 · Verifica sulla deploy preview**
  - Complessità: bassa
  - Descrizione: `curl -I` sulle vecchie URL e controllo di sitemap e feed pubblicati.
  - Acceptance: `/posts/<slug>/` risponde 301 verso `/blog/<slug>/`, `/posts/draft/*` risponde 404, sitemap e feed non contengono bozze.
  - Dipendenze: T2.3, T6.3

## Rollout

Da aggiornare a ogni task completato.

- Task totali: 18
- Fatti: 0
- Da fare: 18
- Prossimo task: T1.1 · Snapshot di riferimento del sito Astro
