/**
 * netlify/functions/send-report.js
 * -----------------------------------------------------------------------
 * Receives the test's results from the browser, builds an HTML report,
 * and emails it via Gmail SMTP.
 *
 * Can be called at several points, distinguished by `payload.status`:
 *   'completed' — the student finished the whole test normally.
 *   'partial'   — a silent milestone update (after Reading, after
 *                 Listening, after each Speaking answer). Each one
 *                 overwrites the previous in the teacher's inbox in
 *                 spirit (same student, growing data) — there is no
 *                 dedup at the email level, so the teacher may see
 *                 several emails for one student if they progress
 *                 normally. The LAST one before normal completion is
 *                 superseded by the 'completed' email.
 *   'abandoned' — sent via navigator.sendBeacon when the student closes
 *                 the tab mid-test. Carries whatever was available at
 *                 that moment.
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
 * Change RECIPIENT_EMAIL below if the report should go somewhere else.
 * -----------------------------------------------------------------------
 */
const nodemailer = require('nodemailer');

const RECIPIENT_EMAIL = 'lantsmangleb@gmail.com';

function escapeHtml(str) {
  return String(str === undefined || str === null ? '' : str).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
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

function renderSpeakingTable(speaking) {
  if (!speaking || speaking.length === 0) {
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
    const { student, reading, listening, speaking, status } = payload;
    const safeStatus = status || 'completed'; // default keeps old callers working unchanged

    const subjectPrefix = safeStatus === 'completed' ? ''
      : safeStatus === 'abandoned' ? '⚠️ [Не завершён] '
      : '⏳ [Промежуточный] ';

    const html = `
      <div style="font-family:Arial,Helvetica,sans-serif;color:#1f2933;max-width:720px;">
        <h2 style="margin-bottom:4px;">Результаты вступительного теста RE-Academy</h2>
        ${renderStatusBanner(safeStatus)}

        <h3>Студент</h3>
        <p style="line-height:1.6;">
          ${escapeHtml(student && student.firstName)} ${escapeHtml(student && student.lastName)}<br>
          Email: ${escapeHtml(student && student.email)}<br>
          Город: ${escapeHtml(student && student.city)}, Страна: ${escapeHtml(student && student.country)}<br>
          Год рождения: ${escapeHtml(student && student.birthYear)}, Пол: ${escapeHtml(student && student.gender)}
        </p>

        <h3>Чтение: ${reading ? `${reading.correct} / ${reading.total} (${reading.percent}%)` : 'не пройдено'}</h3>
        ${reading && reading.breakdown && reading.breakdown.length ? renderBreakdownTable(reading.breakdown) : '<p style="color:#5b6472;font-size:13px;">Раздел не пройден.</p>'}

        <h3>Аудирование: ${listening ? `${listening.correct} / ${listening.total} (${listening.percent}%)` : 'не пройдено'}</h3>
        ${listening && listening.breakdown && listening.breakdown.length ? renderBreakdownTable(listening.breakdown) : '<p style="color:#5b6472;font-size:13px;">Раздел не пройден.</p>'}

        <h3>Говорение</h3>
        ${renderSpeakingTable(speaking)}
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
