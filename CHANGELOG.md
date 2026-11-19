# Changelog

How the Training Cycle App develops over time. Each version lists what changed and shows the app at
that point (screenshots taken at iPhone 14 Pro size with demo data).

Versions follow [semantic versioning](https://semver.org/): `0.x` while the app is taking shape,
a minor bump (0.**2**.0) for new features, a patch bump (0.1.**1**) for small fixes and tweaks.
The current version is shown at the bottom of **Settings**.

---

## 0.1.0 — 2026-11-19 · First version

The first usable version: a 9-week cycle of the Russian Masters Squat Routine, adapted for squat,
bench press and deadlift, with three sessions a week.

| Plan | Session | Secondary exercises | Exercises | Settings |
|---|---|---|---|---|
| ![Plan](docs/screenshots/v0.1.0/plan.jpg) | ![Session](docs/screenshots/v0.1.0/session.jpg) | ![Secondary exercises](docs/screenshots/v0.1.0/session-secondary.jpg) | ![Exercises](docs/screenshots/v0.1.0/exercises.jpg) | ![Settings](docs/screenshots/v0.1.0/settings.jpg) |

### Added
- **Plan:** "Next up" card, 9 weeks × 3 sessions with dates (`23.11. – 29.11.`), session dots for
  done / next / started, and a progress bar with "x of 27 sessions done". Fits one iPhone screen
  without scrolling.
- **Session:** sets with weight, reps and a tick. Values save instantly — no "finish" button.
  Previous/next arrows to move between sessions.
- **Program rules:** each session pairs one lift's variant 2 (progressing volume, then intensity)
  with another lift's variant 1 (6×2 @ 80%). Weights are 1RM × %, rounded to one decimal.
- **Re-test:** the week-9 single at 105% becomes the 1RM for the next cycle; "Start next cycle"
  appears once all three re-tests are done, and old cycles stay in the history.
- **Secondary exercises** in groups A/B/C (one group per session), with "last time" hints,
  adjustable set count and per-exercise history.
- **Comments** per exercise and a note per session.
- **Settings:** start date and 1RM in one "Current cycle" box; 1RM editing behind the gear icon with
  a warning and Cancel/Save; backup export/import (JSON); delete all data; version number.
- **Storage:** everything is kept on the device in IndexedDB, works without a server.
- Mobile layout: bottom tab bar, large tap targets, light and dark mode, safe-area support.

### Fixed during development
- The Session tab no longer jumps to the next session when the last set is ticked.
- Date fields no longer overflow their box in iPhone Safari.
- Starting a cycle and adding exercises work when the app is opened over the local network (plain http).
