# Training Cycle App

A mobile-first React app for a 9-week strength cycle with three sessions a week, based on the
Russian Masters Squat Routine adapted for squat, bench press and deadlift.

- **Plan:** all 27 sessions at a glance, with progress
- **Session:** log weight and reps per set; values save instantly
- **Exercises:** primary lifts (1RM-based percentages) and secondary exercises in groups A/B/C with history
- **Settings:** start date, 1RM, backup export/import

The week-9 single at 105% is the re-test and becomes the 1RM for the next cycle.

Data is stored locally in the browser (IndexedDB). Use **Export backup** in Settings to keep a copy.

## Development

```bash
npm install
npm run dev
```

Program rules live in `src/program.js`, storage in `src/store.js`, screens in `src/screens/`.
