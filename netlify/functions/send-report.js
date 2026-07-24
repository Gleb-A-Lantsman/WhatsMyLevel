/**
 * netlify/functions/send-report.js
 * -----------------------------------------------------------------------
 * Receives the test's results from the browser, builds an HTML report,
 * and emails it via Gmail SMTP.
 *
 * Can be called at several points, distinguished by `payload.status`:
 *   'completed' — the student finished the whole test normally.
 *   'partial'   — a silent milestone update (after Reading, after
 *                 Listening, and 25 minutes into Speaking).
 *   'abandoned' — sent via navigator.sendBeacon when the student closes
 *                 the tab mid-test. Carries whatever was available at
 *                 that moment.
 *
 * NEW (July 2026): instead of a pile of Supabase links + tables to work
 * through, the teacher's email now leads with ONE link that opens the
 * Speaking Notes review page (speaking-notes.html) with everything
 * already filled in: student details, Reading/Listening scores and
 * answer breakdowns, and every Speaking audio link pasted into its
 * question slot.
 *
 * How the link works: this function saves the whole review dataset as a
 * JSON file in Supabase Storage (by calling the sibling save-review
 * function — same bucket and lifetime as the audio files), then links
 * to  speaking-notes.html#u=<url-of-that-json> . The review page
 * fetches the JSON and pre-fills itself. If saving the JSON fails for
 * any reason, the email automatically falls back to the old full-table
 * layout, so no data is ever lost.
 *
 * Required environment variables (set in Netlify, never in the code):
 *   GMAIL_USER          — the Gmail address sending the report
 *   GMAIL_APP_PASSWORD  — a Gmail "App Password" (NOT your normal Gmail
 *                          password, and not an OAuth token). Generate one
 *                          at https://myaccount.google.com/apppasswords
 *                          (requires 2-Step Verification to be turned on
 *                          for the account first). It's a 16-character
 *                          code with no spaces when you paste it in.
 *
 * Change RECIPIENT_EMAIL / REVIEW_PAGE_URL below if either moves.
 * -----------------------------------------------------------------------
 */
const nodemailer = require('nodemailer');

const RECIPIENT_EMAIL = 'lantsmangleb@gmail.com';
const REVIEW_PAGE_URL = 'https://re-entry-test.netlify.app/speaking-notes.html';

function escapeHtml(str) {
  return String(str === undefined || str === null ? '' : str).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

function ruMonthYear() {
  const months = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
  const now = new Date();
  return `${months[now.getMonth()]} ${now.getFullYear()}`;
}

function renderBreakdownTable(breakdown) {
  const rows = (breakdown || []).map((item, i) => `
    <tr>
      <td style="padding:6px 10px;border:1px solid #e3e8ef;">${i + 1}</td>
      <td style="padding:6px 10px;border:1px solid #e3e8ef;">${escapeHtml(item.questionText)}</td>
      <td style="padding:6px 10px;border:1px solid #e3e8ef;color:${item.isCorrect ? '#16a34a' : '#dc2626'};">
        ${item.studentAnswer ? escapeHtml(item.studentAnswer) : '<em>не отвечено</em>'} ${item.isCorrect ? '✓' : '✗'}
      </td>
      <td style="padding:6px 10px;border:1px solid #e3e8ef;">${escapeHtml(item.correctAnswer)}</td>
    </tr>`).join('');

  return `
    <table style="border-collapse:collapse;width:100%;font-size:13px;margin-bottom:24px;">
      <thead>
        <tr style="background:#eef1f6;">
          <th style="padding:6px 10px;border:1px solid #e3e8ef;text-align:left;">#</th>
          <th style="padding:6px 10px;border:1px solid #e3e8ef;text-align:left;">Вопрос</th>
          <th style="padding:6px 10px;border:1px solid #e3e8ef;text-align:left;">Ответ студента</th>
          <th style="padding:6px 10px;border:1px solid #e3e8ef;text-align:left;">Правильный ответ</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`;
}

// Maps a percentage score to a CEFR-style band, using the same
// percentage thresholds as most standardised English tests.
function percentToCefr(pct) {
  if (pct === null || pct === undefined) return { band: '—', label: 'нет данных', color: '#9aa5b1' };
  if (pct < 20) return { band: 'A0',  label: 'Novice (ниже A1)',     color: '#9aa5b1' };
  if (pct < 35) return { band: 'A1',  label: 'Beginner',             color: '#e07b39' };
  if (pct < 50) return { band: 'A2',  label: 'Elementary',           color: '#e0a839' };
  if (pct < 63) return { band: 'B1',  label: 'Intermediate',         color: '#5aab61' };
  if (pct < 77) return { band: 'B2',  label: 'Upper Intermediate',   color: '#2d9cdb' };
  if (pct < 90) return { band: 'C1',  label: 'Advanced',             color: '#6c63ff' };
                return { band: 'C2',  label: 'Proficient',           color: '#1f2933' };
}

function renderScoreCircle(score, total, cefr) {
  const pct = total ? Math.round((score / total) * 100) : 0;
  const radius = 28, circ = Math.round(2 * Math.PI * radius);
  const filled = Math.round((pct / 100) * circ);
  return `
    <td style="padding:12px 20px;vertical-align:middle;width:50%;">
      <table style="border-collapse:collapse;">
        <tr>
          <td style="padding-right:14px;">
            <svg width="72" height="72" viewBox="0 0 72 72">
              <circle cx="36" cy="36" r="${radius}" fill="none" stroke="#e3e8ef" stroke-width="7"/>
              <circle cx="36" cy="36" r="${radius}" fill="none" stroke="${cefr.color}" stroke-width="7"
                stroke-dasharray="${filled} ${circ - filled}"
                stroke-dashoffset="${Math.round(circ * 0.25)}"
                stroke-linecap="round"/>
              <text x="36" y="40" text-anchor="middle" font-size="14" font-weight="700"
                font-family="Arial,sans-serif" fill="${cefr.color}">${score}</text>
            </svg>
          </td>
          <td style="vertical-align:middle;">
            <div style="font-size:11px;color:#5b6472;margin-bottom:2px;">из ${total} (${pct}%)</div>
            <div style="font-size:17px;font-weight:800;color:${cefr.color};">${cefr.band}</div>
            <div style="font-size:12px;color:#5b6472;">${cefr.label}</div>
          </td>
        </tr>
      </table>
    </td>`;
}

function renderCefrScaleRow(activeBand) {
  const bands = [
    {range:'0–19%', band:'A0'}, {range:'20–34%', band:'A1'}, {range:'35–49%', band:'A2'},
    {range:'50–62%', band:'B1'}, {range:'63–76%', band:'B2'}, {range:'77–89%', band:'C1'}, {range:'90–100%', band:'C2'}
  ];
  const cells = bands.map(b => {
    const active = b.band === activeBand;
    return `<td style="border:1px solid #e3e8ef;padding:6px 8px;text-align:center;font-size:11px;background:${active ? '#2563eb' : '#f3f6fa'};color:${active ? '#fff' : '#5b6472'};font-weight:${active ? 700 : 400};">
      ${b.band}<br><span style="font-size:10px;">${b.range}</span>
    </td>`;
  }).join('');
  return `<table style="border-collapse:collapse;width:100%;margin-bottom:8px;"><tr>${cells}</tr></table>`;
}

function renderAssessmentTemplate(reading, listening, speaking) {
  const rPct  = reading  && reading.total  ? reading.percent  : null;
  const lPct  = listening && listening.total ? listening.percent : null;
  const avgPct = (rPct !== null && lPct !== null) ? Math.round((rPct + lPct) / 2) : (rPct ?? lPct);
  const rCefr  = percentToCefr(rPct);
  const lCefr  = percentToCefr(lPct);
  const oCefr  = percentToCefr(avgPct);
  const speakingCount = (speaking || []).filter(s => s.audioUrl).length;
  const speakingTotal = (speaking || []).length || 15;

  return `
    <div style="margin-top:32px;border-top:2px solid #e3e8ef;padding-top:24px;">
      <h2 style="margin:0 0 4px;font-size:18px;">🎓 Предварительная оценка уровня</h2>
      <p style="color:#5b6472;font-size:13px;margin:0 0 20px;">Заполняется преподавателем RE-Academy после проверки всех разделов.</p>

      <!-- Overall band -->
      <div style="background:#f3f6fa;border-radius:10px;padding:16px 20px;margin-bottom:20px;text-align:center;">
        <div style="font-size:12px;color:#5b6472;margin-bottom:4px;">Общий уровень (Чтение + Аудирование)</div>
        <div style="font-size:32px;font-weight:900;color:${oCefr.color};">${oCefr.band}</div>
        <div style="font-size:13px;color:#5b6472;">${oCefr.label}</div>
        ${renderCefrScaleRow(oCefr.band)}
      </div>

      <!-- Per-section scores -->
      <table style="border-collapse:collapse;width:100%;margin-bottom:20px;">
        <tr>
          ${renderScoreCircle(reading ? reading.correct : 0, reading ? reading.total : 30, rCefr)}
          <td style="width:10px;"></td>
          ${renderScoreCircle(listening ? listening.correct : 0, listening ? listening.total : 30, lCefr)}
        </tr>
        <tr>
          <td style="padding:2px 20px 14px;font-size:12px;color:#5b6472;font-weight:700;">📖 ЧТЕНИЕ</td>
          <td></td>
          <td style="padding:2px 20px 14px;font-size:12px;color:#5b6472;font-weight:700;">🎧 АУДИРОВАНИЕ</td>
        </tr>
      </table>

      <!-- Speaking section -->
      <div style="border:1px solid #e3e8ef;border-radius:8px;padding:14px 18px;margin-bottom:14px;">
        <div style="font-size:13px;font-weight:700;margin-bottom:6px;">🎤 ГОВОРЕНИЕ</div>
        <div style="font-size:12px;color:#5b6472;margin-bottom:8px;">Записей получено: ${speakingCount} из ${speakingTotal}</div>
        <div style="font-size:12px;color:#5b6472;">Оценка преподавателя:</div>
        <div style="border:1px dashed #b6c8e8;border-radius:6px;padding:10px 14px;min-height:60px;margin-top:6px;color:#9aa5b1;font-size:13px;font-style:italic;">
          [ Заполнить после прослушивания ответов ]
        </div>
        <div style="margin-top:10px;display:flex;gap:10px;flex-wrap:wrap;">
          ${['A1','A2','B1','B2','C1','C2'].map(b => `<span style="border:1px solid #e3e8ef;border-radius:4px;padding:3px 10px;font-size:12px;color:#5b6472;">☐ ${b}</span>`).join('')}
        </div>
      </div>

      <!-- Writing section (manual) -->
      <div style="border:1px solid #e3e8ef;border-radius:8px;padding:14px 18px;margin-bottom:14px;">
        <div style="font-size:13px;font-weight:700;margin-bottom:6px;">✍️ ПИСЬМО</div>
        <div style="font-size:12px;color:#5b6472;margin-bottom:8px;">Проверяется вручную преподавателем.</div>
        <div style="border:1px dashed #b6c8e8;border-radius:6px;padding:10px 14px;min-height:60px;margin-top:6px;color:#9aa5b1;font-size:13px;font-style:italic;">
          [ Заполнить после проверки письменного задания ]
        </div>
        <div style="margin-top:10px;display:flex;gap:10px;flex-wrap:wrap;">
          ${['A1','A2','B1','B2','C1','C2'].map(b => `<span style="border:1px solid #e3e8ef;border-radius:4px;padding:3px 10px;font-size:12px;color:#5b6472;">☐ ${b}</span>`).join('')}
        </div>
      </div>

      <!-- Final verdict -->
      <div style="border:1px solid #e3e8ef;border-radius:8px;padding:14px 18px;">
        <div style="font-size:13px;font-weight:700;margin-bottom:8px;">📋 Итоговый вывод преподавателя</div>
        <div style="border:1px dashed #b6c8e8;border-radius:6px;padding:10px 14px;min-height:80px;color:#9aa5b1;font-size:13px;font-style:italic;">
          [ Общий уровень: __ / Рекомендуемая программа: __ / Примечания: __ ]
        </div>
      </div>

      <p style="font-size:11px;color:#9aa5b1;margin-top:16px;">
        © 2014–2026 RE-Academy · Этот отчёт сгенерирован автоматически системой WhatsMyLevel.
      </p>
    </div>`;
}

function renderSpeakingTable(speaking) {
  const withAudio = (speaking || []).filter(s => s.audioUrl);
  if (!speaking || speaking.length === 0 || withAudio.length === 0) {
    return '<p style="color:#5b6472;font-size:13px;">Раздел «Говорение» ещё не начат или ни один ответ не был записан.</p>';
  }
  const rows = speaking.map((item) => `
    <tr>
      <td style="padding:8px 10px;border:1px solid #e3e8ef;vertical-align:top;width:55%;">
        <strong>Part ${escapeHtml(item.part)}${item.topic ? ' / ' + escapeHtml(item.topic) : ''}</strong><br>
        ${escapeHtml(item.prompt).replace(/\n/g, '<br>')}
      </td>
      <td style="padding:8px 10px;border:1px solid #e3e8ef;vertical-align:top;">
        ${item.audioUrl ? `<a href="${item.audioUrl}" target="_blank">▶ Прослушать ответ</a>` : '<em>запись недоступна</em>'}
      </td>
    </tr>`).join('');

  return `
    <table style="border-collapse:collapse;width:100%;font-size:13px;">
      <thead>
        <tr style="background:#eef1f6;">
          <th style="padding:8px 10px;border:1px solid #e3e8ef;text-align:left;">Вопрос</th>
          <th style="padding:8px 10px;border:1px solid #e3e8ef;text-align:left;">Ответ</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`;
}

// A status banner so it's never ambiguous, at a glance, whether this
// email represents a finished test or a snapshot of one still (or no
// longer) in progress.
function renderStatusBanner(status) {
  if (status === 'completed') return '';
  if (status === 'abandoned') {
    return `<div style="background:#fef2f2;border:1px solid #f5c2c2;color:#9b1c1c;padding:10px 16px;border-radius:8px;margin-bottom:18px;font-weight:600;">
      ⚠️ Студент закрыл вкладку до завершения теста — ниже только то, что успело сохраниться.
    </div>`;
  }
  // 'partial'
  return `<div style="background:#fff7e6;border:1px solid #f0d999;color:#92660a;padding:10px 16px;border-radius:8px;margin-bottom:18px;font-weight:600;">
    ⏳ Промежуточный отчёт — тест ещё не завершён, это лишь срез текущего прогресса.
  </div>`;
}

// -----------------------------------------------------------------------
// Review-page link: package the whole dataset for speaking-notes.html
// -----------------------------------------------------------------------

// The 15 Speaking questions, in the exact order data.js defines them and
// the review page lists them. Audio is matched to these by questionId
// (NOT by arrival order), so a slow upload that finishes out of order
// still lands in the right slot. Keep this in sync with data.js if the
// speaking questions ever change.
const SPEAKING_QUESTION_ORDER = [
  'p1q1', 'p1q2', 'p1q3', 'p1q4', 'p1q5', 'p1q6', 'p1q7', 'p1q8',
  'p2q1',
  'p3q1', 'p3q2', 'p3q3', 'p3q4', 'p3q5', 'p3q6'
];

// The compact format the review page expects:
//   n=name, g=gender, e=email, c=city, dt=test date,
//   r/l={s: correct, t: total}, links=[audio urls in question order],
//   ra/la=[{q, a, ok, corr}] answer breakdowns.
function buildReviewData(student, reading, listening, speaking) {
  const mapBreakdown = (breakdown) => (breakdown || []).map((item) => {
    const row = {
      q: item.questionText,
      a: item.studentAnswer || '',
      ok: !!item.isCorrect
    };
    if (!item.isCorrect) row.corr = item.correctAnswer;
    return row;
  });

  // Build audio links positioned by questionId. Each speaking answer
  // carries its questionId (added in app.js); we place its URL at that
  // question's index. Any question with no recording stays an empty
  // string, which the review page shows as a normal empty paste slot.
  const byId = {};
  (speaking || []).forEach((s) => {
    if (s && s.questionId && s.audioUrl) byId[s.questionId] = s.audioUrl;
  });
  const links = SPEAKING_QUESTION_ORDER.map((qid) => byId[qid] || '');

  return {
    n: `${(student && student.firstName) || ''} ${(student && student.lastName) || ''}`.trim(),
    g: (student && student.gender) || '',
    e: (student && student.email) || '',
    c: [student && student.city, student && student.country].filter(Boolean).join(', '),
    dt: ruMonthYear(),
    r: reading ? { s: reading.correct, t: reading.total } : null,
    l: listening ? { s: listening.correct, t: listening.total } : null,
    links: links,
    ra: reading ? mapBreakdown(reading.breakdown) : [],
    la: listening ? mapBreakdown(listening.breakdown) : []
  };
}

// Saves the review dataset as a JSON file in Supabase Storage via the
// sibling save-review function (same bucket and credentials as the
// audio files — nothing new to configure), and returns the
// ready-to-click review page link. Returns null on any failure; the
// caller then falls back to the full-table email, so no data is lost.
async function createReviewLink(event, sessionId, reviewData) {
  try {
    const siteUrl = process.env.URL || `https://${event.headers.host}`;
    const res = await fetch(`${siteUrl}/.netlify/functions/save-review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: sessionId || `review-${Date.now()}`,
        reviewData
      })
    });
    if (!res.ok) throw new Error(`save-review responded ${res.status}`);
    const data = await res.json();
    if (!data || !data.url) throw new Error('no url in save-review response');
    return `${REVIEW_PAGE_URL}#u=${encodeURIComponent(data.url)}`;
  } catch (err) {
    console.error('Review link creation failed (email falls back to full tables):', err);
    return null;
  }
}

function renderReviewButton(link, reviewData) {
  const audioCount = (reviewData.links || []).filter(Boolean).length;
  const audioTotal = (reviewData.links || []).length;
  return `
    <div style="background:#f0f7f2;border:1px solid #bfe3cd;border-radius:10px;padding:20px 22px;margin:18px 0 24px;text-align:center;">
      <a href="${link}" target="_blank"
         style="display:inline-block;background:#1c2b4a;color:#e6d38f;text-decoration:none;font-weight:700;font-size:16px;padding:14px 30px;border-radius:8px;">
        🎧 Открыть страницу проверки
      </a>
      <p style="font-size:13px;color:#3f5147;margin:14px 0 0;line-height:1.5;">
        Всё уже на месте: данные студента, баллы за чтение и аудирование с разбором ответов
        и аудиозаписи говорения (${audioCount} из ${audioTotal || '—'}) — каждая в своём вопросе.
      </p>
    </div>`;
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  let payload;
  try {
    payload = JSON.parse(event.body);
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON body' }) };
  }

  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    console.error('Missing GMAIL_USER / GMAIL_APP_PASSWORD environment variables');
    return { statusCode: 500, body: JSON.stringify({ error: 'Server is not configured (missing Gmail credentials)' }) };
  }

  try {
    const { student, reading, listening, speaking, status, sessionId } = payload;
    const safeStatus = status || 'completed'; // default keeps old callers working unchanged

    const subjectPrefix = safeStatus === 'completed' ? ''
      : safeStatus === 'abandoned' ? '⚠️ [Не завершён] '
      : '⏳ [Промежуточный] ';

    // Build the one-click review link. Created for every completed test,
    // and for partial/abandoned snapshots once at least one Speaking
    // answer exists (before that there is nothing to grade on the page).
    const uploadedCount = (speaking || []).filter(s => s && s.audioUrl).length;
    let reviewLink = null;
    let reviewData = null;
    if (safeStatus === 'completed' || uploadedCount > 0) {
      reviewData = buildReviewData(student, reading, listening, speaking);
      reviewLink = await createReviewLink(event, sessionId, reviewData);
    }

    const studentBlock = `
        <h3>Студент</h3>
        <p style="line-height:1.6;">
          ${escapeHtml(student && student.firstName)} ${escapeHtml(student && student.lastName)}<br>
          Email: ${escapeHtml(student && student.email)}<br>
          Город: ${escapeHtml(student && student.city)}, Страна: ${escapeHtml(student && student.country)}<br>
          Год рождения: ${escapeHtml(student && student.birthYear)}, Пол: ${escapeHtml(student && student.gender)}
        </p>`;

    const scoreSummary = `
        <p style="font-size:14.5px;line-height:1.7;">
          📖 Чтение: <strong>${reading ? `${reading.correct} / ${reading.total} (${reading.percent}%)` : 'не пройдено'}</strong><br>
          🎧 Аудирование: <strong>${listening ? `${listening.correct} / ${listening.total} (${listening.percent}%)` : 'не пройдено'}</strong><br>
          🎤 Говорение: <strong>${uploadedCount} ${uploadedCount === 1 ? 'запись' : 'записей'}</strong> — оценивается на странице проверки
        </p>`;

    const fullTables = `
        <h3>Чтение: ${reading ? `${reading.correct} / ${reading.total} (${reading.percent}%)` : 'не пройдено'}</h3>
        ${reading && reading.breakdown && reading.breakdown.length ? renderBreakdownTable(reading.breakdown) : '<p style="color:#5b6472;font-size:13px;">Раздел не пройден.</p>'}

        <h3>Аудирование: ${listening ? `${listening.correct} / ${listening.total} (${listening.percent}%)` : 'не пройдено'}</h3>
        ${listening && listening.breakdown && listening.breakdown.length ? renderBreakdownTable(listening.breakdown) : '<p style="color:#5b6472;font-size:13px;">Раздел не пройден.</p>'}

        <h3>Говорение</h3>
        ${renderSpeakingTable(speaking)}`;

    let bodyHtml;
    if (reviewLink) {
      // New streamlined layout: one link up top, full data kept below
      // as a backup in case the review page can't load its JSON later
      // (e.g. the stored file was deleted).
      bodyHtml = `
        ${studentBlock}
        ${renderReviewButton(reviewLink, reviewData)}
        ${scoreSummary}
        <hr style="border:none;border-top:2px solid #e3e8ef;margin:26px 0 18px;">
        <p style="font-size:12px;color:#9aa5b1;letter-spacing:0.04em;text-transform:uppercase;font-weight:700;">
          Резервная копия данных (если страница проверки не открывается)
        </p>
        ${fullTables}`;
    } else {
      // Fallback: the old full layout, including the manual assessment
      // template on completed tests.
      bodyHtml = `
        ${studentBlock}
        ${fullTables}
        ${safeStatus === 'completed' ? renderAssessmentTemplate(reading, listening, speaking) : ''}`;
    }

    const html = `
      <div style="font-family:Arial,Helvetica,sans-serif;color:#1f2933;max-width:720px;">
        <h2 style="margin-bottom:4px;">Результаты вступительного теста RE-Academy</h2>
        ${renderStatusBanner(safeStatus)}
        ${bodyHtml}
      </div>`;

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD
      }
    });

    const studentLabel = student ? `${student.firstName} ${student.lastName}`.trim() : 'Студент';

    await transporter.sendMail({
      from: `"RE-Academy Test" <${process.env.GMAIL_USER}>`,
      to: RECIPIENT_EMAIL,
      subject: `${subjectPrefix}Результаты вступительного теста — ${studentLabel || 'без имени'}`,
      html
    });

    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  } catch (err) {
    console.error('send-report error:', err);
    return { statusCode: 500, body: JSON.stringify({ error: String(err && err.message ? err.message : err) }) };
  }
};
