# StageSync — Frontend

A theatre production and cue management interface in plain HTML, CSS and vanilla JavaScript. No build step, no dependencies.

## File structure

```
stagesync/
├── index.html                  Landing page
├── dashboard.html              Overview of productions and rehearsals
├── production-studio.html      Productions, acts, scenes, cue groups
├── cue-sheet.html              Cue table with type filters
├── performance-console.html    GO / HOLD / RESUME
├── rehearsal-sandbox.html      Cue sequence validator
├── css/
│   ├── base.css                Colours, fonts, spacing, navigation, footer
│   ├── components.css          Buttons, forms, tables, tags, filters
│   └── pages.css               Layouts for each page
└── js/
    ├── data.js                 Sample data (shaped like future API responses)
    ├── api.js                  The only file that fetches data
    ├── components.js           Navigation, footer and small helpers (the UI object)
    ├── dashboard.js            One script per page
    ├── studio.js
    ├── cue-sheet.js
    ├── console.js
    └── sandbox.js
```

Each page loads the same three shared scripts (`data.js`, `api.js`, `components.js`), then its own script. Each page's `<body data-page="...">` tells `components.js` which navigation link to highlight.

## How to run

Open `index.html` in a browser by double-clicking it. Everything works from the file system.

Or serve the folder locally, which is closer to how Flask will serve it:

```
cd stagesync
python3 -m http.server 8000
```

Then visit http://localhost:8000.

Fonts (Cormorant Garamond and Inter) load from Google Fonts. Offline, the page falls back to Georgia and Arial.

## What each page does

- **Dashboard**: counts, productions, upcoming rehearsals, links to every section.
- **Production Studio**: add productions, acts, scenes and cue groups. Additions are stored in your browser (localStorage), so they survive a refresh and appear on the Dashboard.
- **Cue Sheet**: lighting, sound, props and actor cues grouped by act. Filter by type.
- **Performance Console**: GO advances to the next cue, HOLD pauses the show, RESUME continues. A log records each action. "Reset show" starts again.
- **Rehearsal Sandbox**: type cue numbers (or pick a preset, or click cue chips) and test the sequence. A sequence is invalid if a cue is unknown, repeated, out of script order, or called before a cue it requires.

## Connecting to Flask later

All data access goes through `js/api.js`. In that file:

1. Set `USE_SAMPLE_DATA = false`.
2. Set `API_BASE` to your Flask address.
3. Build these endpoints to return the same JSON shapes found in `js/data.js`:

| Function | Method and path |
|---|---|
| `getProductions()` | `GET /api/productions` |
| `getRehearsals()` | `GET /api/rehearsals` |
| `getCues(id)` | `GET /api/productions/<id>/cues` |
| `createProduction(title)` | `POST /api/productions` |
| `addAct(id, title)` | `POST /api/productions/<id>/acts` |
| `addScene(productionId, actId, title)` | `POST /api/acts/<id>/scenes` |
| `addCueGroup(productionId, sceneId, name)` | `POST /api/scenes/<id>/cue-groups` |

The mutation endpoints should return the updated production so the Studio can redraw. If the frontend is served from a different port than Flask, enable CORS with `flask-cors`. The sandbox rules live in `validateSequence()` in `js/sandbox.js` and can later move to a Flask route unchanged in spirit.

## Design notes

Colours and fonts are CSS variables at the top of `css/base.css` (`--black`, `--wine`, `--ivory`, `--font-serif`, `--font-sans`). Change them there and the whole interface follows.
