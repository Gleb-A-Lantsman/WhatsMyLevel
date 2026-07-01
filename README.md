# WhatsMyLevel — RE-Academy Entry Test

**Live app:** [re-entry-test.netlify.app](https://re-entry-test.netlify.app)

A fully automated IELTS-style entry assessment built for [RE-Academy (Royal English)](https://re-academy.co.uk) — a London-based IELTS and GRE preparation school. Students complete the test independently; the teacher receives a detailed report by email with no manual intervention required.

---

## What the test covers

The test has three sections and takes approximately **65 minutes** in total.

### 📖 Reading — 25 minutes, 30 questions
Four progressive tasks:
- **Vocabulary in context** — 6 sentences, 4-option multiple choice
- **Dual-passage matching** — two short texts (Notting Hill Carnival / Rio Carnival); students decide whether each of 6 statements applies to Passage A, Passage B, or Both
- **Single passage comprehension** — hotel brochure text, 8 multiple-choice questions
- **Email comprehension** — informal email text, 10 multiple-choice questions

### 🎧 Listening — 25 minutes, 30 questions
Three tasks, each with a separate audio recording (playable up to twice):
- Three sets of 10 spoken prompts; for each, the student selects the most appropriate response from 3–4 options
- Custom audio player with a play-count limit and live time display
- Headers read "Choose the best response to Speaker N" consistently across all tasks

### 🎤 Speaking — approximately 15 minutes, 15 questions
Mirrors the real IELTS Speaking test structure:
- **Part 1** (8 questions, 45 seconds each): two topics — *Your City* and *Weekends*
- **Part 2** (1 question, 2 minutes): cue card format — student reads the prompt, has 1 minute to prepare (skippable), then speaks for up to 2 minutes
- **Part 3** (6 questions, 60 seconds each): two topics — *Skills and Abilities* and *Salaries for Skilled People*

Each question is introduced by a short video of the teacher asking the question. After the video, a 5-second countdown runs, then recording starts automatically. The student can finish early by clicking "Я закончил(а) отвечать!" Answers are uploaded to Supabase Storage immediately after each recording, not batched at the end.

---

## How the test flows

1. **Registration** — student enters name, email, city, country, birth year, and gender, and consents to data processing
2. **Audio check** — plays a test tone; student confirms sound is working before proceeding
3. **Welcome screen** — teacher intro video (video0-0) plays automatically; overview of all three sections and the test rules
4. **Reading section** — 25-minute countdown, four tasks with a dot-rail position indicator; both panes scroll to top on each new task; unanswered-question modal warns before advancing
5. **Break** (5 minutes, skippable)
6. **Listening section** — 25-minute countdown, three tasks with a custom audio player
7. **Break** (5 minutes, skippable)
8. **Speaking intro** — instructions including paper/pen and mic permission reminder
9. **Microphone check** — student grants access, records 3 seconds, plays it back, confirms before proceeding (required; cannot be skipped)
10. **Speaking Part 1 intro** — video1-0 plays on its own screen ("К вопросам!" to continue)
11. **Speaking Part 1** — 8 questions, fully automatic (video → 5s countdown → recording → next question)
12. **Speaking Part 2 intro** — video2-0 plays; then the cue card question with 1-minute prep; video2-2 ("Can you start speaking now?") plays before recording begins
13. **Speaking Part 3 intro** — video3-0 plays; then 6 questions
14. **Finish screen** — video3-7 ("Well done") plays automatically; report submission status shown

---

## Key UX details

- **Tab-close protection** — a browser leave/stay dialog fires if the student tries to close or navigate away mid-test; disarmed automatically on the finish and test-expired screens
- **Video replay button** — appears in the bottom-right corner of the video frame after each question video finishes, allowing a re-watch without restarting the sequence
- **Part 2 cue card** — styled to resemble the physical card used in the real IELTS exam (cream background, bordered); only the cue card is shown to the student, not the question text for Parts 1 or 3
- **Skip prep** — "Я закончил(а) готовиться!" lets students who are ready early skip the Part 2 preparation minute
- **Scroll reset** — both panes scroll to the top when a new Reading or Listening task loads
- **Countdown label** — the 5-second pre-recording countdown correctly says "Начинаем подготовку через:" for Part 2 and "Запись начнётся через:" for Parts 1 and 3

---

## Reporting and data

### Incremental saving (no data loss on abandonment)
- **After Reading finishes** → a silent partial report is emailed to the teacher
- **After Listening finishes** → another silent partial report
- **25 minutes after Speaking begins** → a single delayed partial report (not one per question), capturing all recordings uploaded so far; cancelled if the student finishes normally before the timer fires
- **On tab close** → `navigator.sendBeacon` fires an abandonment report with whatever has been completed, as long as at least one question was answered anywhere in the test

### Final completion report
Sent once, when the student finishes the last Speaking question. Contains:
- Student registration details
- Full Reading breakdown (30 questions, student answer vs. correct answer, ✓/✗)
- Full Listening breakdown (30 questions, same format)
- Speaking section with a signed Supabase link for each recorded answer (valid 30 days), organised by Part and topic
- **Assessment template** — a pre-populated teacher grading sheet including:
  - Overall CEFR band derived from the average of Reading and Listening percentages, with a colour-coded scale bar (A0 → C2)
  - SVG score circles per section showing raw score, percentage, and CEFR band
  - Speaking grading box (fill-in manually) with A1–C2 checkbox options
  - Writing grading box (fill-in manually) with A1–C2 checkbox options
  - Final verdict field for overall level, recommended programme, and notes

### Email status labels
Partial and abandonment emails are clearly marked in the subject line and body:
- `⏳ [Промежуточный]` — mid-test snapshot
- `⚠️ [Не завершён]` — student left before finishing

### Audio storage
Speaking recordings are uploaded immediately after each answer to a private Supabase Storage bucket (`entry-test-recordings`). Links in the report are **signed URLs** (valid 30 days), not public links — the bucket remains private.

---

## Branding and metadata

- **RE-Academy logo** appears in the topbar throughout Reading and Listening, and above the card on all Speaking screens
- **Copyright footer** — "© 2014–2026 RE-Academy" appears on every screen (hidden on the two-pane task layout to avoid overlapping the navigation button)
- **Social/Telegram preview** — Open Graph and Twitter Card meta tags are set with a Russian-language title and description, pointing to the hosted logo as the preview image
- **Page title** — "RE-Academy — Вступительный тест"

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | Vanilla HTML/CSS/JS (no framework), single-page app |
| Hosting | Netlify (static site + serverless functions) |
| Audio recording | MediaRecorder API |
| Speaking upload | Netlify Function → Supabase Storage (signed URLs) |
| Report email | Netlify Function → Gmail SMTP via nodemailer |
| Data | All test content in `data.js`; no database for student answers |
| Video | MP4 files served as static assets from the `video/` folder |
| Audio | MP3 files served as static assets from the `audio/` folder |

---

## Content files

All test content lives in `data.js` and is easy to edit without touching any application logic:

- `breakSeconds` — duration of the optional break between sections
- `welcomeVideo` — path to the teacher intro video on the Welcome screen
- `audioCheck.audioUrl` — path to the audio check tone
- `reading.tasks` — array of 4 reading tasks (vocabulary, matching, single passage, email)
- `listening.tasks` — array of 3 listening tasks with audio file paths and questions
- `speakingIntros` — per-part intro video paths (video1-0, video2-0, video3-0)
- `speakingPart2Prompt` — path to video2-2 ("Can you start speaking now?")
- `speakingOutro` — path to video3-7 ("Well done")
- `speaking.tasks` — array of 15 speaking questions with video paths, timing, and prompts

---

*Built by Gleb Lantsman · RE-Academy · © 2014–2026*
