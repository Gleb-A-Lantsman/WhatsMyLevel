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
audio/audio-check.mp3
audio/listening-1.mp3
audio/listening-2.mp3
audio/listening-3.mp3
```

`audio-check.mp3` is the short "this is an audio check" recording — it plays on the audio check screen (right after Welcome, before Reading starts) so students can confirm their sound works before any timer starts. The other three are the Listening tasks.

(Or edit the `audioUrl` paths in `data.js` — `audioCheck.audioUrl` for the check, each task's `audioUrl` for Listening — if you'd rather name the files differently.) If a file is missing, the app shows a small inline error instead of breaking — handy for testing before the real files are in place.

## Deploying

This lives in its own repo (`WhatsMyLevel`), so everything goes straight into the root — no subfolder needed:

1. Upload `index.html`, `styles.css`, `data.js`, `app.js`, and the `audio/` folder into the root of the repo (replacing any placeholder `index.html` that's there).
2. In Netlify, point a site at this repo with the base directory left blank (`.`) and no build command — it's static files only.

No environment variables needed.

## A note on content

The Reading passages and questions are original content written for this test, not copied from any third-party test provider — safe to use commercially.
