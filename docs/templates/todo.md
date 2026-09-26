# TODO: <Titolo della issue>

Issue: <#numero o link>

<Da creare solo quando la issue non ha più domande aperte né blocker.>

<!-- Note di stesura (da cancellare):
- Fase = onda: i task di una fase sono indipendenti e parallelizzabili.
- Le dipendenze puntano solo a fasi precedenti.
- Ogni task può essere fatto da un agente o da un umano. Aggiungi "(HUMAN ONLY)" alla complessità solo se serve un umano (deploy preview, controllo visivo, push…).
- Task con file in comune nella stessa fase: affidali allo stesso agente.
- Conteggi del Rollout da verificare con: grep -c '^- \[ \]'
-->

## Fase 1: <Nome della fase>

- [ ] **T1.1 · <Titolo del task>**
  - Complessità: <low | medium | high>
  - Descrizione: <Breve descrizione di cosa va fatto.>
  - File toccati: <percorsi>
  - Acceptance: <Condizione verificabile per considerare il task completato.>
  - Dipende da: <nessuno | T1.x, T2.x>
- [ ] **T1.2 · <Titolo del task>**
  - Complessità: <low | medium | high> (HUMAN ONLY: <motivo>)
  - Descrizione: <...>
  - File toccati: <...>
  - Acceptance: <...>
  - Dipende da: <...>

## Fase 2: <Nome della fase>

- [ ] **T2.1 · <Titolo del task>**
  - Complessità: <low | medium | high>
  - Descrizione: <...>
  - File toccati: <...>
  - Acceptance: <...>
  - Dipende da: <...>

## Rollout

Da aggiornare a ogni task completato.

- Task totali: <N>
- Fatti: <N>
- Da fare: <N> (di cui HUMAN ONLY: <N>)
- Fase corrente: <N · nome>
- Prossimo task: <T#.# · titolo, oppure "nessuno" se tutto è completato>
