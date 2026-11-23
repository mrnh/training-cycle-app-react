# Training Cycle App

A mobile-first React app for a 9-week strength cycle with three sessions a week, based on the
Russian Masters Squat Routine adapted for up to three main lifts (squat, bench press and deadlift
by default).

- **Overview:** all 27 sessions at a glance, with progress
- **Session:** start the next session in order, tick sets and log weight and reps; values save
  instantly, and "Finish session" stores the workout permanently. One session is open at a time;
  the others are previews. Each exercise has a rest timer, and exercises can be added for the
  session
- **History:** every finished workout, newest first, with a check per exercise for done as
  prescribed; tap one for its sets and weights
- **Settings:** start date, up to three main lifts with their 1RM, accessory work groups A/B/C with
  sets, reps, weight and rest for each, the exercise catalog (each exercise with its history and
  personal bests for 1 to 5 reps), kg/lbs, date format and rounding of planned weights, backup export/import and sample data

The week-9 single at 105% is the re-test and becomes the 1RM for the next cycle.

**Use it:** [mrnh.github.io/training-cycle-app-react](https://mrnh.github.io/training-cycle-app-react/)
(published from `main` on every push).

Data is stored locally in the browser (IndexedDB), on each device separately. Use **Export backup** in Settings to keep a copy.

### Install on your phone

The app is a PWA: it can be added to the home screen and then works offline, full screen and
with its own icon.

- **iPhone (Safari):** Share → *Add to Home Screen*.
- **Android (Chrome):** menu → *Install app* (or *Add to Home screen*).

On iPhone the installed app has **its own storage, separate from Safari**, so it starts empty.
Move your data once: in Safari, Settings → *Export backup*; in the installed app, Settings →
*Import backup*. When a new version is published, the app shows *New version available* →
*Reload*; it never switches in the middle of a workout on its own.

<p>
  <img src="docs/screenshots/v0.10.0/overview.jpg" width="200" alt="Overview screen">
  <img src="docs/screenshots/v0.15.0/session.jpg" width="200" alt="Session screen">
  <img src="docs/screenshots/v0.17.0/history.jpg" width="200" alt="History screen">
  <img src="docs/screenshots/v0.16.0/settings.jpg" width="200" alt="Settings screen">
</p>

See the [changelog](CHANGELOG.md) for how the app has developed, with screenshots of each version.

## Releasing a new version

1. Bump `version` in `package.json` (`npm version minor --no-git-tag-version` or `patch`).
   To test the real build (offline copy, update prompt): `npm run build && npm run preview`,
   then open `http://localhost:4173/training-cycle-app-react/`. After changing `public/icon.svg`,
   run `npm run icons`.
2. Add screenshots to `docs/screenshots/vX.Y.Z/` and a new entry at the top of `CHANGELOG.md`.
3. Commit, then tag and push: `git tag -a vX.Y.Z -m "vX.Y.Z" && git push --follow-tags`.

## Development

```bash
npm install
npm run dev
```

Program rules live in `src/program.js`, storage in `src/store.js`, screens in `src/screens/`.

## License

[GNU General Public License v3.0 or later](LICENSE). Anyone may use, change and share this app.
Software that includes it or is built on it must be released under the same license, with its
source code.
