# RE-Academy Entry Test

A 3-part placement test (Reading → Listening → Speaking) for new RE-Academy students, built as a plain HTML/CSS/JS app — no build step, no framework, deploys as-is.

## Files

| File | What it's for |
|---|---|
| `index.html` | The screens themselves (registration, rules, audio check, intros, question containers, modal). |
| `styles.css` | All visual styling — colors, layout, responsive rules. Edit the `:root` variables at the top to change the color palette globally. |
| `data.js` | **All test content.** Reading passages/questions, Listening transcripts/questions/audio paths, and Speaking prompts. Edit this file to change wording, swap questions, or add tasks — you should never need to touch `app.js`. |
| `app.js` | The logic: screen navigation, timers, answer tracking, the unanswered-question modal, and the microphone recorder for Speaking. |

## Adding your audio files

The Listening section is fully built — three tasks, 10 questions each, custom audio player (max 2 plays, no pausing/seeking mid-playback, matching the rules shown on the intro screen). It just needs the actual recordings.

Convert your `.m4a` files to `.mp3` and drop them into an `audio/` folder next to `index.html`, named exactly:

```
audio/listening-1.mp3
audio/listening-2.mp3
audio/listening-3.mp3
```

(Or edit the `audioUrl` path for each task in `data.js` if you'd rather name them differently.) If a file is missing, the app shows a small inline error on that task instead of breaking — handy for testing before the real files are in place.

## Deploying

**Option A — drag and drop:** Go to your Netlify dashboard → "Add new site" → "Deploy manually" → drag this whole `entry-test` folder onto the page. Done.

**Option B — GitHub:** Add this folder to your `RE-Academy-Launcher` repo (e.g. as `entry-test/`), push it, and either point a Netlify site at that subfolder (Site settings → Build & deploy → Base directory) or create it as its own Netlify site pointing at the repo root if you split it out into its own repo.

No build command or environment variables are needed — it's static files only.

## A note on content

The Reading passages and questions are original content written for this test, not copied from any third-party test provider — safe to use commercially.
