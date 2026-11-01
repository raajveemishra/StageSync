/* ==========================================================
   StageSync — data.js
   Sample data used until the Flask backend exists.
   The shapes below are what the API should return as JSON.
   ========================================================== */

const SAMPLE_DATA = {
  productions: [
    {
      id: "p1",
      title: "The Cherry Orchard",
      playwright: "Anton Chekhov",
      venue: "Main Stage",
      opening: "2026-11-20",
      status: "In rehearsal",
      active: true,
      acts: [
        {
          id: "a1", title: "Act I",
          scenes: [
            { id: "a1s1", title: "The Nursery, Dawn",
              cueGroups: [{ id: "g1", name: "Dawn Opening", cues: ["LX1", "SQ1", "PR1", "AC1"] }] },
            { id: "a1s2", title: "The Arrival",
              cueGroups: [{ id: "g2", name: "Carriage and Entrance", cues: ["SQ2", "AC2", "LX2"] }] },
          ],
        },
        {
          id: "a2", title: "Act II",
          scenes: [
            { id: "a2s1", title: "The Field by the Chapel",
              cueGroups: [
                { id: "g3", name: "Evening Field", cues: ["LX3", "SQ3", "PR2"] },
                { id: "g4", name: "The Breaking String", cues: ["SQ4"] },
              ] },
          ],
        },
        {
          id: "a3", title: "Act III",
          scenes: [
            { id: "a3s1", title: "The Ballroom",
              cueGroups: [
                { id: "g5", name: "The Ball", cues: ["LX4", "SQ5", "PR3"] },
                { id: "g6", name: "The Announcement", cues: ["AC3"] },
              ] },
          ],
        },
        {
          id: "a4", title: "Act IV",
          scenes: [
            { id: "a4s1", title: "The Empty Nursery",
              cueGroups: [{ id: "g7", name: "Final Sequence", cues: ["LX5", "SQ6", "LX6"] }] },
          ],
        },
      ],
    },
    {
      id: "p2",
      title: "Twelfth Night",
      playwright: "William Shakespeare",
      venue: "Studio Theatre",
      opening: "2026-12-12",
      status: "Pre-production",
      acts: [
        {
          id: "p2a1", title: "Act I",
          scenes: [
            { id: "p2a1s1", title: "The Duke's Court", cueGroups: [] },
            { id: "p2a1s2", title: "The Sea Coast", cueGroups: [] },
          ],
        },
      ],
    },
    {
      id: "p3",
      title: "Hedda Gabler",
      playwright: "Henrik Ibsen",
      venue: "Main Stage",
      opening: "2027-01-30",
      status: "Planning",
      acts: [],
    },
  ],

  rehearsals: [
    { id: "r1", productionId: "p1", title: "Act I Technical Run",        date: "2026-11-02", start: "18:30", end: "21:30", venue: "Main Stage" },
    { id: "r2", productionId: "p1", title: "Sound Levels and Cue Timing", date: "2026-11-04", start: "18:30", end: "21:00", venue: "Main Stage" },
    { id: "r3", productionId: "p1", title: "Cue-to-Cue: Acts II and III", date: "2026-11-06", start: "18:00", end: "22:00", venue: "Main Stage" },
    { id: "r4", productionId: "p1", title: "Full Run with Lights",        date: "2026-11-07", start: "14:00", end: "18:30", venue: "Main Stage" },
    { id: "r5", productionId: "p2", title: "Company Read-through",        date: "2026-11-09", start: "17:30", end: "20:00", venue: "Studio Theatre" },
  ],

  /* Cues are listed in script order. "requires" holds the cues
     that must already have been called before this one. */
  cues: [
    { id: "LX1", productionId: "p1", type: "Lighting", sceneId: "a1s1", title: "Dawn wash",               detail: "Cool blue-amber wash through the nursery window, 8s fade up", trigger: "Stage Manager's call, house out", requires: [] },
    { id: "SQ1", productionId: "p1", type: "Sound",    sceneId: "a1s1", title: "Birdsong and bells",       detail: "Morning birdsong, distant church bells, low level",           trigger: "With LX1",                         requires: ["LX1"] },
    { id: "PR1", productionId: "p1", type: "Props",    sceneId: "a1s1", title: "Candle and coffee tray",   detail: "Lit candle on sill, tray to Dunyasha",                        trigger: "Dunyasha's first entrance",        requires: ["LX1"] },
    { id: "AC1", productionId: "p1", type: "Actor",    sceneId: "a1s1", title: "Lopakhin enters",          detail: "Stage right door, holding his watch",                         trigger: "After Dunyasha's opening line",    requires: ["SQ1"] },
    { id: "SQ2", productionId: "p1", type: "Sound",    sceneId: "a1s2", title: "Carriage on gravel",       detail: "Wheels and hooves approach, then fade out",                   trigger: "Lopakhin crosses to window",       requires: ["AC1"] },
    { id: "AC2", productionId: "p1", type: "Actor",    sceneId: "a1s2", title: "Ranevskaya and Anya enter", detail: "Stage left, travelling coats, Anya carries a hat box",       trigger: "Carriage sound fades",             requires: ["SQ2"] },
    { id: "LX2", productionId: "p1", type: "Lighting", sceneId: "a1s2", title: "Sunrise build",            detail: "Warm gold build over 12s, window gobo lifts",                 trigger: "Ranevskaya reaches centre",        requires: ["AC2"] },
    { id: "LX3", productionId: "p1", type: "Lighting", sceneId: "a2s1", title: "Evening gold",             detail: "Low amber side light, long shadows across the field",         trigger: "Act II opening, curtain up",       requires: ["LX2"] },
    { id: "SQ3", productionId: "p1", type: "Sound",    sceneId: "a2s1", title: "Shepherd's pipe",          detail: "Single pipe, distant, stage right",                           trigger: "Charlotta finishes her speech",    requires: ["LX3"] },
    { id: "PR2", productionId: "p1", type: "Props",    sceneId: "a2s1", title: "Bench and wayside shrine", detail: "Set before the act, bench at centre",                         trigger: "Preset, act break",                requires: ["LX3"] },
    { id: "SQ4", productionId: "p1", type: "Sound",    sceneId: "a2s1", title: "The breaking string",      detail: "Distant snapped string, long tail, sky speakers",             trigger: "Silence after Ranevskaya's line",  requires: ["SQ3"] },
    { id: "LX4", productionId: "p1", type: "Lighting", sceneId: "a3s1", title: "Chandeliers up",           detail: "Full ballroom state, warm white, 6s",                         trigger: "Act III opening",                  requires: ["LX3"] },
    { id: "SQ5", productionId: "p1", type: "Sound",    sceneId: "a3s1", title: "Waltz from the hall",      detail: "Small orchestra, offstage left, under dialogue",              trigger: "With LX4",                         requires: ["LX4"] },
    { id: "PR3", productionId: "p1", type: "Props",    sceneId: "a3s1", title: "Auction notice and ledger", detail: "Folded notice to Gaev, ledger on side table",                trigger: "Gaev returns",                     requires: ["LX4"] },
    { id: "AC3", productionId: "p1", type: "Actor",    sceneId: "a3s1", title: "Lopakhin announces",       detail: "Centre stage, slightly intoxicated, holds the notice",        trigger: "Waltz fades",                      requires: ["PR3"] },
    { id: "LX5", productionId: "p1", type: "Lighting", sceneId: "a4s1", title: "Bare room, cold light",    detail: "Flat winter white, shadows removed, 10s",                     trigger: "Act IV opening",                   requires: ["AC3"] },
    { id: "SQ6", productionId: "p1", type: "Sound",    sceneId: "a4s1", title: "Axes on distant trees",    detail: "Slow, rhythmic, far off, builds over 20s",                    trigger: "Last character exits",             requires: ["LX5"] },
    { id: "LX6", productionId: "p1", type: "Lighting", sceneId: "a4s1", title: "Fade to black",            detail: "Slow fade, 15s, hold sound for 5s after blackout",            trigger: "Final line",                       requires: ["SQ6"] },
  ],
};
