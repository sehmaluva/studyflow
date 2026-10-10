# StudyFlow

A lightweight study planner that runs entirely in the browser. Add the tasks you
need to study, track what is still pending, and see how much you have finished —
no build step, no backend, no dependencies.

## Features

- **Add study tasks** with a title, subject, due date, and priority (Low / Medium / High).
- **Mark tasks complete or pending** individually, and delete the ones you no longer need.
- **Filter the list** by All, Pending, or Completed.
- **Dashboard stats** showing total, completed, and pending counts.
- **Progress bar** that reflects the share of tasks you have completed.
- **Overdue highlighting** for unfinished tasks whose due date has passed.
- **Persistent storage** — tasks are saved in `localStorage`, so the list survives a refresh.
- **Accessible markup** — labelled form fields, `aria-pressed` filter buttons, an
  `aria-live` error region, and a `role="progressbar"` with live values.
- **Safe rendering** — task cards are built with `createElement` and `textContent`, so a
  title like `<b>Quiz</b>` is displayed as plain text.

## Getting started

There is nothing to install. Open `index.html` in a modern browser, or serve the
folder locally:

```bash
python3 -m http.server 8000
```

Then visit <http://localhost:8000>.

JavaScript must be enabled; the page shows a `<noscript>` notice otherwise.

## Project structure

| File | Purpose |
| --- | --- |
| `index.html` | Page layout: sidebar filters, dashboard stats, progress, task form, and task list. |
| `style.css` | All styling — design tokens, layout, and components. |
| `script.js` | Application logic: storage, validation, filtering, stats, and rendering. |

## How data is stored

Tasks are kept in a single `localStorage` key and read back on load. Each stored task
is validated and normalised (missing priority falls back to `Medium`, missing subject
to `General`), and entries without a usable title are dropped. If storage is
unavailable or corrupted, the app falls back to an empty list and logs the error
rather than failing.

Because data lives in the browser, it is per-browser and per-device: clearing site
data removes your tasks, and tasks do not sync between devices.

## Development

Edit the files directly and reload the page — there is no tooling to run. Plain HTML,
CSS, and JavaScript (ES5-compatible syntax, no modules, no transpiling).

## License

No license has been specified for this project yet.
