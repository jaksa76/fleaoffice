# Show Requirements

## Overview

A modern presentation tool built around a **timeline of slides** — a linear sequence of focused moments, each with a clear message. Show odbacuje model "bullet-point slajdova" iz legacy softvera (PowerPoint, Keynote) i daje korisniku alat koji naglašava sadržaj i vizuelni utisak. Radi na Fleabox serveru i čuva prezentacije kao JSON fajlove.

## Presentations (Home Screen)

- Korisnik vidi sve svoje prezentacije kao kartice (naziv, broj slajdova, datum izmene)
- Kreiranje nove prezentacije (unosi naziv)
- Preimenovanje prezentacije
- Brisanje prezentacije (sa potvrdom)
- Otvaranje prezentacije u editoru

## Timeline Model

- Svaka prezentacija je **linearna sekvenca slajdova** — timeline
- Slajdovi se prikazuju i prezentuju redom, od prvog do poslednjeg
- Editor prikazuje slajdove kao horizontalni ili vertikalni niz (thumbnail prikaz)
- Korisnik može da doda, obriše, pomeri i duplicira slajdove

## Slides

Svaki slajd ima:
- **Layout** — jedan od unapred definisanih rasporeda elemenata
- **Content blocks** — sadržaj koji popunjava layout
- **Tema** — nasleđuje temu prezentacije (može se overridovati po slajdu)
- **Speaker notes** — beleške za predavača, nevidljive publici

## Layouts

Korisnik bira layout pri kreiranju slajda. Layouti su fiksirani — nema slobodnog pozicioniranja elemenata.

| Layout | Opis |
|--------|------|
| `title` | Veliki naslov + opcioni podnaslov, centrirano |
| `statement` | Jedna snažna izjava, full-bleed tekst |
| `text` | Naslov + paragraf teksta |
| `image` | Full-bleed slika + opcioni natpis |
| `image-text` | Slika s jedne strane, tekst s druge |
| `quote` | Citat + atribucija |
| `list` | Naslov + kratka lista (max 5 stavki — enforced) |
| `code` | Naslov + code block sa syntax highlightingom |
| `chart` | Naslov + grafikon (bar, line ili pie) |
| `table` | Naslov + tabela sa podacima |
| `video` | Embedded video (URL) ili uploaded fajl |
| `blank` | Prazno platno bez predefinisanih zona |

## Content Types

Svaki content block je direktno editabilan u editoru:

| Tip | Detalji |
|-----|---------|
| **Naslov / tekst** | Plain text; bold i italic putem Markdown sintakse |
| **Bullet lista** | Max 5 stavki (enforced) |
| **Slika** | Upload sa uređaja; čuva se via Fleabox API |
| **Video** | URL (YouTube, Vimeo) ili upload video fajla |
| **Audio** | URL ili upload audio fajla |
| **Grafikon** | Bar, line, pie — podaci se unose direktno u aplikaciji |
| **Tabela** | Korisnik definiše redove i kolone, unosi podatke |
| **Code block** | Unos koda, bira se programski jezik za syntax highlighting |
| **Citat** | Tekst citata + polje za atribuciju |

## Themes

- Tema se postavlja na nivou prezentacije
- Može se overridovati na nivou pojedinačnog slajda
- Korisnik bira jednu od unapred definisanih tema (ne može da kreira sopstvene u v1)
- Tema kontroliše: boje pozadine i teksta, tipografiju (fontove), raspored elemenata unutar layouta

| Tema | Opis |
|------|------|
| `minimal` | Bela pozadina, tamni tekst, čisti sans-serif (default) |
| `dark` | Tamna pozadina, svetli tekst |
| `warm` | Kremasta pozadina, topli tonovi |
| `bold` | Jarke boje, naglašena tipografija |
| `nature` | Zeleni i zemljani tonovi |

## Editor

- **Levi panel**: thumbnail lista slajdova (timeline prikaz)
- **Centralni deo**: WYSIWYG editing aktivnog slajda
- **Desni panel**: opcije slajda (layout picker, tema override, speaker notes)
- Dodavanje novog slajda: bira se layout iz pickera
- Reorder slajdova: drag-and-drop u lijevom panelu
- Duplikanje i brisanje slajdova
- Auto-save: debounced, 2 sekunde nakon poslednje izmene
- Ručni save (dugme ili Ctrl+S)
- Undo/Redo (u okviru sesije)

## Presenter Mode

- Fullscreen prikaz slajda za publiku
- Navigacija napred/nazad:
  - Tastatura (strelice, space)
  - Swipe gesta (mobilni/tablet)
  - On-screen dugmad
- Speaker notes prikazane u odvojenom, manjem delu ekrana (vidljive samo predavaču)
- Brojač slajdova (npr. "3 / 12")
- Izlaz iz presenter mode vraća korisnika na editor, na trenutni slajd

## Export

- Export prezentacije u **PDF** (jedan slajd = jedna stranica)
- Export čuva vizuelni prikaz slajdova (tema, layout, sadržaj)
- Speaker notes nisu uključene u PDF (opcija za uključivanje u v2)

## Data Storage

Prezentacije se čuvaju kao JSON fajlovi:
```
/api/show/data/<presentation-slug>.json
```

Uploadovani fajlovi (slike, video, audio) čuvaju se pored JSON fajla:
```
/api/show/data/<presentation-slug>-<timestamp>-<filename>
```

### JSON struktura

```json
{
  "id": "my-presentation",
  "title": "My Presentation",
  "theme": "minimal",
  "created": "2026-04-08T10:00:00Z",
  "modified": "2026-04-08T12:30:00Z",
  "slides": [
    {
      "id": "slide-1",
      "layout": "title",
      "themeOverride": null,
      "content": {
        "title": "Dobrodošli",
        "subtitle": "Uvod u novu eru prezentacija"
      },
      "notes": "Predstavi se publici."
    }
  ]
}
```

## Fleabox API

| Operacija | Metod | Putanja |
|-----------|-------|---------|
| Lista prezentacija | `GET` | `/api/show/data/` |
| Učitaj prezentaciju | `GET` | `/api/show/data/<slug>.json` |
| Sačuvaj prezentaciju | `PUT` | `/api/show/data/<slug>.json` |
| Obriši prezentaciju | `DELETE` | `/api/show/data/<slug>.json` |
| Upload fajla | `PUT` | `/api/show/data/<slug>-<ts>-<file>` |

## URL Structure

Hash-based routing (kao Write app):

| Pogled | URL |
|--------|-----|
| Home (lista prezentacija) | `/show/#/` |
| Editor | `/show/#/editor/<slug>` |
| Presenter mode | `/show/#/present/<slug>` |
| Presenter mode na slajdu N | `/show/#/present/<slug>/<n>` |

## UI & Design

Prati Fleaoffice UI Guidelines:
- Mobile-first, responsive (desktop i mobilni)
- 8px spacing grid
- Minimalan chrome — sadržaj je u prvom planu
- Suptilne tranzicije (150–250ms)
- Touch targeti min 44×44px
- Light/dark mode prati `prefers-color-scheme` sistemsko podešavanje

## Technical Stack

Konzistentno sa ostatkom Fleaoffice suite:
- **React 19** + **TypeScript**
- **Vite** (base path: `/show/`)
- **React Router** (hash-based)
- `useStorage()` hook za sve API pozive (isti pattern kao Write app)
- Bez eksternih UI biblioteka

## Out of Scope (v1)

- Export u PPTX ili druge formate
- Deljenje prezentacija sa drugim korisnicima
- Real-time kolaboracija
- Animacije između slajdova (osim jednostavnog fade-a)
- Kreiranje sopstvenih tema
- Speaker notes u PDF exportu
- Offline rad bez Fleabox servera
