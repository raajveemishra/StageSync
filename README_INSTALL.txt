# StageSync Automata Visualiser patch

This patch adds an Automata Visualiser page with two isolated playgrounds:
- DFA: command sequences are run against a fresh StageSyncFA instance using the selected production's cues.
- PDA: symbol sequences are run against a fresh StageSyncPDA instance.

The playground does not modify live performance state or saved production data.

## Install
1. Back up your current project folder.
2. Copy `automata-visualiser.html` into the project root.
3. Copy `js/automata.js` into `js/`.
4. Replace `backend/app.py`, `js/api.js`, `js/components.js`, `css/pages.css`, and `index.html` with the corresponding files in this patch.
5. Restart Flask so the two new API routes are registered.
6. Refresh the frontend page.

## Test
- Open `automata-visualiser.html`.
- DFA example: `GO, GO, HOLD, GO, RESUME, GO, RESET`
- PDA valid example: `OPEN_ACT, OPEN_SCENE, OPEN_GROUP, CLOSE_GROUP, CLOSE_SCENE, CLOSE_ACT`
- PDA invalid example: `OPEN_ACT, OPEN_SCENE, CLOSE_ACT`

The DFA playground uses the selected production's cue list. The PDA playground accepts the same six symbols used by the backend PDA engine.
