# RE-Academy Entry Test

A 3-part placement test (Reading → Listening → Speaking) for new RE-Academy students, built as a plain HTML/CSS/JS app — no build step, no framework, deploys as-is.

## Files

| File | What it's for |
|---|---|
| `index.html` | The screens themselves (registration, rules, audio check, intros, question containers, modal). |
| `styles.css` | All visual styling — colors, layout, responsive rules. Edit the `:root` variables at the top to change the color palette globally. |
| `data.js` | **All test content.** Reading passages/questions, Listening transcripts/questions/audio paths, and Speaking prompts. Edit this file to change wording, swap questions, or add tasks — you should never need to touch `app.js`. |
| `app.js` | The logic: screen navigation, timers, breaks, answer tracking, the unanswered-question modal, the audio/video players, and the microphone recorder for Speaking. |
| `assets/logo.png` | The real RE-Academy logo, shown on the registration screen. |
| `assets/favicon.ico`, `favicon-16.png`, `favicon-32.png`, `apple-touch-icon.png` | Browser-tab icon, cropped from the logo's crown+RE mark. |

Full folder layout:

```
WhatsMyLevel/
├── index.html
├── styles.css
├── data.js
├── app.js
├── README.md
├── assets/
│   ├── logo.png
│   ├── favicon.ico
│   ├── favicon-16.png
│   ├── favicon-32.png
│   └── apple-touch-icon.png
├── audio/
│   └── ...
└── video/
    └── ...
```

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

The Speaking section runs as 15 individual questions across 4 topics (Part 1: "Your city" + "Weekends", Part 2: cue card, Part 3: "Skills and abilities" + "Salaries for skilled people") — all real content now, not placeholders. The header above each question shows "Part N / Topic" throughout (e.g. "Part 2 / Someone you know who does something well"), and the question text is shown on screen alongside the video.

Pressing **Следующий вопрос** on the first question plays its video, then a 5-second countdown, then (Part 2 only) a 1-minute prep, then recording starts automatically. The button stays active during recording and reads **"Я закончил(а) отвечать!"** — clicking it (or letting the timer run out) immediately moves to the next question and starts its video, no extra click needed.

Drop your videos into a `video/` folder next to `index.html`, named:

```
video/video1-1.mp4 … video/video1-8.mp4   (Part 1, 8 questions)
video/video2-1.mp4                         (Part 2, 1 question)
video/video3-1.mp4 … video/video3-6.mp4   (Part 3, 6 questions)
```

(Edit `videoUrl` in `data.js` for each task if you'd rather name them differently.) Same as the audio files — if one's missing, the app shows an inline note and still moves the flow along so you can keep testing.

One thing worth knowing if you're testing locally: this app was built and tested using a sandboxed Chromium that doesn't include H.264 (MP4) video decoding — only royalty-free formats like VP9/WebM. That's a quirk of the *testing* environment only; real Chrome, Edge, Safari, and Firefox (what your students will actually use) all play standard `.mp4` files natively, so this won't affect them. If you ever test locally in a stripped-down browser build and a video won't play, that's likely why — try an actual desktop browser.

## A note on the new progress bar

The progress bar in the top panel is split into one segment per task in the current section. The current task's segment fills in light blue as questions are answered (not yet submitted); once you click Далее, that segment locks in as solid blue and the next one starts filling.

## Breaks between sections

After Reading and after Listening, students land on a single screen that both confirms the section is done (showing all 3 sections with a checkmark on whatever's finished) and offers a skippable rest period ("Вы отдыхаете: X минут Y секунд") before the next section's intro — there's no separate click-through step anymore. Change how long the break lasts by editing `breakSeconds` at the top of `data.js` (currently 5 minutes).

## What happens if time runs out

If a section's timer hits zero while a student is still working, that section is automatically submitted as-is (whatever was answered counts, the rest is left blank) and they move on to the next part — the test is **not** cancelled for running over on a single section.

The full-cancellation screen ("Тест отменён") is still in the code (`expireTest()` in `app.js`, `#screen-test-expired` in `index.html`) but nothing currently calls it — it's kept on hand for a future trigger like prolonged inactivity, not for ordinary time-limit overruns.

This lives in its own repo (`WhatsMyLevel`), so everything goes straight into the root — no subfolder needed:

1. Upload `index.html`, `styles.css`, `data.js`, `app.js`, the `assets/` folder, and the `audio/` and `video/` folders into the root of the repo (replacing any placeholder `index.html` that's there).
2. In Netlify, point a site at this repo with the base directory left blank (`.`) and no build command — it's static files only.

No environment variables needed.

## A note on content

The Reading passages and questions are original content written for this test, not copied from any third-party test provider — safe to use commercially.
