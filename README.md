# RE-Academy Entry Test

A 3-part placement test (Reading → Listening → Speaking) for new RE-Academy students, built as a plain HTML/CSS/JS app — no build step, no framework, deploys as-is.

## Files

| File | What it's for |
|---|---|
| `index.html` | The screens themselves (registration, rules, audio check, intros, question containers, modal). |
| `styles.css` | All visual styling — colors, layout, responsive rules. Edit the `:root` variables at the top to change the color palette globally. |
| `data.js` | **All test content.** Reading passages/questions, Listening transcripts/questions/audio paths, and Speaking prompts. Edit this file to change wording, swap questions, or add tasks — you should never need to touch `app.js`. |
| `app.js` | The logic: screen navigation, timers, answer tracking, the unanswered-question modal, the audio/video players, and the microphone recorder for Speaking. |
| `logo.png` | The real RE-Academy logo, shown on the registration screen. |

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

## Adding your Speaking videos

The Speaking section now follows the real IELTS format: pressing **Следующий вопрос** plays a video automatically, then a 5-second countdown runs, then — for Part 2 questions only — a 1-minute prep period, then recording starts automatically (the REC indicator lights up) for the question's time limit. There's no manual record/stop button anymore; it's fully automatic, matching a real exam.

Drop your videos into a `video/` folder next to `index.html`, named:

```
video/speaking-1.mp4
video/speaking-2.mp4
```

(Edit `videoUrl` in `data.js` for each task if you'd rather name them differently.) Same as the audio files — if one's missing, the app shows an inline note and still moves the flow along so you can keep testing.

One thing worth knowing if you're testing locally: this app was built and tested using a sandboxed Chromium that doesn't include H.264 (MP4) video decoding — only royalty-free formats like VP9/WebM. That's a quirk of the *testing* environment only; real Chrome, Edge, Safari, and Firefox (what your students will actually use) all play standard `.mp4` files natively, so this won't affect them. If you ever test locally in a stripped-down browser build and a video won't play, that's likely why — try an actual desktop browser.

## A note on the new progress bar

The progress bar in the top panel is now split into one segment per task in the current section. The current task's segment fills in light blue as questions are answered (not yet submitted); once you click Далее, that segment locks in as solid blue and the next one starts filling. If a section's timer reaches zero, the whole test ends immediately (a "Тест отменён" screen, matching the time-limit-exceeded behavior from your reference) — this is different from successfully finishing a section's tasks, which moves you forward as normal.

This lives in its own repo (`WhatsMyLevel`), so everything goes straight into the root — no subfolder needed:

1. Upload `index.html`, `styles.css`, `data.js`, `app.js`, `logo.png`, and the `audio/` and `video/` folders into the root of the repo (replacing any placeholder `index.html` that's there).
2. In Netlify, point a site at this repo with the base directory left blank (`.`) and no build command — it's static files only.

No environment variables needed.
