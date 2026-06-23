/**
 * app.js
 * -----------------------------------------------------------------------
 * Screen-by-screen navigation logic for the RE-Academy entry test.
 * Content (passages, questions, prompts) lives in data.js — this file
 * only knows how to render and navigate whatever it finds there.
 * -----------------------------------------------------------------------
 */

// ---------------------------------------------------------------------
// Shared state
// ---------------------------------------------------------------------
const state = {
  readingTaskIndex: 0,
  readingAnswers: {},      // { questionId: answerValue }
  readingTimerHandle: null,
  readingRemaining: 0,
  readingDotObserver: null,

  listeningTaskIndex: 0,
  listeningAnswers: {},
  listeningTimerHandle: null,
  listeningRemaining: 0,
  listeningDotObserver: null,

  modalConfirmFn: null,    // which "advance" function the modal's Далее button should call

  muted: false,
  volume: 1,
  breakHandle: null,

  studentInfo: null,
  speakingRecordings: [],  // [{ questionId, part, topic, prompt, blob }]
  reportStatus: 'idle',    // 'idle' | 'sending' | 'sent' | 'error'

  speakingIndex: 0,
  countdownHandle: null,
  prepHandle: null,
  speakHandle: null,
  mediaRecorder: null,
  audioChunks: [],
  micStream: null,

  shownPartIntros: {},     // { 1: true, 2: true, 3: true } — each Part's intro video plays once
  partIntroContinueFn: null, // what "К вопросам!" should do next

  pendingForceAdvance: false
};

// ---------------------------------------------------------------------
// Generic helpers
// ---------------------------------------------------------------------
function formatTime(totalSeconds) {
  const s = Math.max(0, Math.round(totalSeconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, '0')}`;
}

function showScreen(id) {
  document.querySelectorAll('audio, video').forEach(el => { try { el.pause(); } catch (e) {} });
  const target = document.getElementById(id);
  if (!target) {
    console.error(`showScreen: no element with id="${id}" found in index.html. Is index.html up to date with app.js?`);
    return;
  }
  document.querySelectorAll('.screen').forEach(el => el.classList.remove('active'));
  target.classList.add('active');
  document.getElementById('topbar').classList.remove('visible');
}

function showTopbar(label) {
  document.getElementById('topbarLabel').textContent = label;
  document.getElementById('topbar').classList.add('visible');
}

// Updates the mm:ss text + the small warning pie chart next to it.
function updateTimerDisplay(remaining, total) {
  document.getElementById('topbarTimerText').textContent = formatTime(remaining);
  const pct = total ? Math.max(0, Math.min(100, (remaining / total) * 100)) : 0;
  const isWarning = pct <= 20;
  const pie = document.getElementById('timePie');
  pie.classList.toggle('warning', isWarning);
  const color = isWarning ? 'var(--color-danger)' : 'var(--color-primary)';
  pie.style.background = `conic-gradient(${color} 0% ${pct}%, var(--color-bg-soft-deep) ${pct}% 100%)`;
}

// Renders the topbar progress bar as one segment per task: segments before
// the current task are solid (submitted), the current task fills in
// proportionally as questions are answered, later segments stay empty.
function renderSectionProgress(totalTasks, currentIndex, currentFraction) {
  const track = document.getElementById('topbarProgress');
  track.innerHTML = '';
  for (let i = 0; i < totalTasks; i++) {
    const seg = document.createElement('div');
    seg.className = 'progress-seg';
    const fill = document.createElement('div');
    fill.className = 'progress-seg-fill';
    if (i < currentIndex) {
      fill.classList.add('done');
    } else if (i === currentIndex) {
      fill.style.width = Math.round(currentFraction * 100) + '%';
    } else {
      fill.style.width = '0%';
    }
    seg.appendChild(fill);
    track.appendChild(seg);
  }
}

// Stops every timer/recording/media element and shows the "time's up,
// test cancelled" screen. Used when a section's time limit runs out.
function expireTest() {
  clearInterval(state.readingTimerHandle);
  clearInterval(state.listeningTimerHandle);
  clearInterval(state.breakHandle);
  clearInterval(state.countdownHandle);
  clearInterval(state.prepHandle);
  clearInterval(state.speakHandle);
  if (state.readingDotObserver) state.readingDotObserver.disconnect();
  if (state.listeningDotObserver) state.listeningDotObserver.disconnect();
  document.querySelectorAll('audio, video').forEach(el => { try { el.pause(); } catch (e) {} });
  if (state.mediaRecorder && state.mediaRecorder.state !== 'inactive') {
    try { state.mediaRecorder.stop(); } catch (e) {}
  }
  if (state.micStream) state.micStream.getTracks().forEach(t => t.stop());
  showScreen('screen-test-expired');
}

// The 3 sections in test order — used to render the "where am I"
// icon row on the section-complete/break screen below.
const ALL_SECTIONS = [
  { label: 'Чтение', icon: '📖' },
  { label: 'Аудирование', icon: '🎧' },
  { label: 'Говорение', icon: '🎤' }
];

function renderSectionIcons(doneCount) {
  const container = document.getElementById('sectionCompleteIcons');
  container.innerHTML = ALL_SECTIONS.map((s, i) => {
    const isDone = i < doneCount;
    return `<div class="card-icon${isDone ? ' done' : ''}"><div class="icon-circle">${isDone ? '✓' : s.icon}</div>${s.label}</div>`;
  }).join('');
}

// One screen that both confirms a section is finished AND offers the
// (skippable) break before the next one — replaces the old separate
// "Отличная работа" + "Перерыв" screens so position-in-test is always
// shown consistently, with all 3 sections visible every time.
function showSectionComplete(doneCount, nextLabel, onContinue) {
  showScreen('screen-section-complete');
  document.getElementById('sectionCompleteSubtitle').textContent =
    `Вы завершили раздел «${ALL_SECTIONS[doneCount - 1].label}»`;
  renderSectionIcons(doneCount);

  let remaining = TEST_DATA.breakSeconds;
  const renderCountdown = () => {
    const m = Math.floor(remaining / 60);
    const s = remaining % 60;
    document.getElementById('breakCountdownText').textContent = `Вы отдыхаете: ${m} минут ${s} секунд`;
  };
  renderCountdown();

  clearInterval(state.breakHandle);
  state.breakHandle = setInterval(() => {
    remaining--;
    if (remaining <= 0) {
      clearInterval(state.breakHandle);
      onContinue();
      return;
    }
    renderCountdown();
  }, 1000);

  const btn = document.getElementById('btnSectionContinue');
  btn.textContent = `Пропустить перерыв и перейти к разделу «${nextLabel}»`;
  btn.onclick = () => {
    clearInterval(state.breakHandle);
    onContinue();
  };
}

document.getElementById('btnExpiredRestart').addEventListener('click', () => {
  location.reload();
});

// ---------------------------------------------------------------------
// Topbar controls: volume + fullscreen
// ---------------------------------------------------------------------
function applyVolume(vol) {
  state.volume = vol;
  document.querySelectorAll('audio, video').forEach(el => { el.volume = vol; });
  const btn = document.getElementById('btnVolume');
  if (vol <= 0) {
    btn.textContent = '🔇';
    btn.classList.add('muted');
  } else {
    btn.textContent = vol < 0.5 ? '🔉' : '🔊';
    btn.classList.remove('muted');
  }
}

document.getElementById('btnVolume').addEventListener('click', (e) => {
  e.stopPropagation();
  document.getElementById('volumePopover').classList.toggle('visible');
});

document.getElementById('volumeSlider').addEventListener('input', (e) => {
  applyVolume(Number(e.target.value) / 100);
});

document.addEventListener('click', (e) => {
  if (!e.target.closest('.volume-control')) {
    document.getElementById('volumePopover').classList.remove('visible');
  }
});

document.getElementById('btnFullscreen').addEventListener('click', () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(() => {});
  } else {
    document.exitFullscreen().catch(() => {});
  }
});
document.addEventListener('fullscreenchange', () => {
  document.getElementById('btnFullscreen').textContent = document.fullscreenElement ? '⤡' : '⤢';
});

// ---------------------------------------------------------------------
// Screen 1 → 2: Registration
// ---------------------------------------------------------------------
document.getElementById('registerForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const form = e.target;
  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }
  state.studentInfo = {
    firstName: document.getElementById('fName').value.trim(),
    lastName: document.getElementById('fLastName').value.trim(),
    email: document.getElementById('fEmail').value.trim(),
    country: document.getElementById('fCountry').value,
    birthYear: document.getElementById('fYear').value,
    city: document.getElementById('fCity').value.trim(),
    gender: document.getElementById('fGender').value
  };
  showScreen('screen-welcome');
  playWelcomeVideoAutoplay();
});

// ---------------------------------------------------------------------
// Screen 2 → 3: Welcome
// ---------------------------------------------------------------------
document.getElementById('btnWelcomeNext').addEventListener('click', () => {
  showScreen('screen-audio');
});

// Welcome screen intro video (video0-0) — autoplays as soon as the
// Welcome screen is shown (right after registration submits, which is
// itself a user gesture, so unmuted autoplay is attempted first). If
// the browser still blocks it, falls back to muted with a replay
// button the student can tap to hear it with sound.
const welcomeVideo = document.getElementById('welcomeVideo');
const btnWelcomeVideoPlay = document.getElementById('btnWelcomeVideoPlay');
if (welcomeVideo && TEST_DATA.welcomeVideo) {
  welcomeVideo.src = TEST_DATA.welcomeVideo.videoUrl;
}
if (btnWelcomeVideoPlay) {
  btnWelcomeVideoPlay.style.display = 'none';
  btnWelcomeVideoPlay.addEventListener('click', () => {
    btnWelcomeVideoPlay.style.display = 'none';
    welcomeVideo.muted = false;
    welcomeVideo.currentTime = 0;
    welcomeVideo.play().catch(() => {
      btnWelcomeVideoPlay.style.display = 'flex';
    });
  });
  welcomeVideo.addEventListener('ended', () => {
    btnWelcomeVideoPlay.style.display = 'flex';
  });
}

function playWelcomeVideoAutoplay() {
  if (!welcomeVideo || !TEST_DATA.welcomeVideo) return;
  welcomeVideo.muted = false;
  welcomeVideo.currentTime = 0;
  welcomeVideo.play().catch(() => {
    welcomeVideo.muted = true;
    welcomeVideo.play().catch(() => {
      if (btnWelcomeVideoPlay) btnWelcomeVideoPlay.style.display = 'flex';
    });
  });
}

// ---------------------------------------------------------------------
// Screen 3: Audio check
// ---------------------------------------------------------------------
const audioCheckEl = document.getElementById('audioCheckEl');
audioCheckEl.src = TEST_DATA.audioCheck.audioUrl;
audioCheckEl.volume = state.volume;

audioCheckEl.addEventListener('error', () => {
  document.getElementById('audioCheckError').style.display = 'block';
  document.getElementById('audioCheckError').innerHTML =
    `Не удалось загрузить аудиофайл. Добавьте файл <code>${TEST_DATA.audioCheck.audioUrl}</code>, чтобы проверить звук.`;
});

document.getElementById('btnPlayTone').addEventListener('click', () => {
  document.getElementById('audioCheckError').style.display = 'none';
  audioCheckEl.currentTime = 0;
  audioCheckEl.play().catch(() => {
    document.getElementById('audioCheckError').style.display = 'block';
    document.getElementById('audioCheckError').innerHTML =
      `Не удалось загрузить аудиофайл. Добавьте файл <code>${TEST_DATA.audioCheck.audioUrl}</code>, чтобы проверить звук.`;
  });
  document.getElementById('audioCheckQuestion').style.display = 'block';
  document.getElementById('audioCheckButtons').style.display = 'flex';
});

document.getElementById('btnAudioYes').addEventListener('click', () => {
  showScreen('screen-reading-intro');
});

document.getElementById('btnAudioNo').addEventListener('click', () => {
  document.getElementById('audioCheckHelp').style.display = 'block';
});

// ---------------------------------------------------------------------
// Screen 4 → 5: Reading section start
// ---------------------------------------------------------------------
document.getElementById('btnReadingStart').addEventListener('click', () => {
  state.readingTaskIndex = 0;
  state.readingAnswers = {};
  state.readingRemaining = TEST_DATA.reading.durationSeconds;

  showScreen('screen-reading-task');
  showTopbar('Чтение');
  renderReadingTask(0);

  clearInterval(state.readingTimerHandle);
  state.readingTimerHandle = setInterval(() => {
    state.readingRemaining--;
    updateTimerDisplay(state.readingRemaining, TEST_DATA.reading.durationSeconds);
    if (state.readingRemaining <= 0) {
      clearInterval(state.readingTimerHandle);
      // Running out of time submits this section as-is and moves on —
      // it no longer cancels the whole test (see finishReadingSection).
      finishReadingSection();
    }
  }, 1000);
  updateTimerDisplay(state.readingRemaining, TEST_DATA.reading.durationSeconds);
});

// ---------------------------------------------------------------------
// Reading task rendering
// ---------------------------------------------------------------------
function renderReadingTask(index) {
  const task = TEST_DATA.reading.tasks[index];

  // Each new task starts both panes scrolled back to the top, instead
  // of keeping whatever scroll position the previous task left behind.
  document.getElementById('readingPassagePane').scrollTop = 0;
  document.getElementById('readingQuestionsPane').scrollTop = 0;

  // ---- Left pane: instructions + passage(s) ----
  let passageHtml = '';
  if (task.partLabel) {
    passageHtml += `<span class="passage-label">${escapeHtml(task.partLabel)}</span>`;
  }
  passageHtml += `<p class="task-instructions">${task.instructions}</p>`;
  if (task.instructionList) {
    passageHtml += '<ul>' + task.instructionList.map(i => `<li>${i}</li>`).join('') + '</ul>';
  }
  task.passages.forEach(p => {
    passageHtml += '<div>';
    if (p.label) passageHtml += `<span class="passage-label">${p.label}</span>`;
    if (p.title) passageHtml += `<p class="passage-title">${p.title}</p>`;
    passageHtml += `<p class="passage-text">${escapeHtml(p.text)}</p>`;
    passageHtml += '</div>';
  });
  document.getElementById('readingPassagePane').innerHTML = passageHtml;

  // ---- Right pane: question cards ----
  let qHtml = '';
  task.questions.forEach((q) => {
    qHtml += `<div class="q-card" data-qid="${q.id}">`;
    qHtml += `<p class="q-text">${escapeHtml(q.text)}</p>`;

    if (task.type === 'match3') {
      qHtml += '<div class="opt-row3">';
      task.options.forEach(opt => {
        qHtml += `<button type="button" class="opt" data-qid="${q.id}" data-value="${opt}">${opt}</button>`;
      });
      qHtml += '</div>';
    } else {
      q.options.forEach((opt, i) => {
        qHtml += `<label class="opt"><input type="radio" name="${q.id}" value="${i}"><span>${escapeHtml(opt)}</span></label>`;
      });
    }
    qHtml += '</div>';
  });
  qHtml += `<div class="task-next-row"><button id="btnReadingNext">Далее</button></div>`;
  document.getElementById('readingQuestionsPane').innerHTML = qHtml;

  // ---- Wire up answer handlers ----
  if (task.type === 'match3') {
    document.querySelectorAll('#readingQuestionsPane .opt-row3 .opt').forEach(btn => {
      btn.addEventListener('click', () => {
        const qid = btn.dataset.qid;
        document.querySelectorAll(`.opt-row3 .opt[data-qid="${qid}"]`).forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        recordReadingAnswer(qid, btn.dataset.value);
      });
    });
  } else {
    document.querySelectorAll('#readingQuestionsPane input[type="radio"]').forEach(radio => {
      radio.addEventListener('change', () => {
        const qid = radio.name;
        document.querySelectorAll(`input[name="${qid}"]`).forEach(r => r.closest('.opt').classList.remove('selected'));
        radio.closest('.opt').classList.add('selected');
        recordReadingAnswer(qid, radio.value);
      });
    });
  }

  document.getElementById('btnReadingNext').addEventListener('click', attemptAdvanceReadingTask);

  // ---- Dot rail ----
  buildDotRail('readingDotRail', task.questions.length);
  attachDotObserver('readingQuestionsPane', '.q-card', 'readingDotRail', 'readingDotObserver');

  updateReadingProgress(task);
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function recordReadingAnswer(qid, value) {
  state.readingAnswers[qid] = value;
  const card = document.querySelector(`#readingQuestionsPane .q-card[data-qid="${qid}"]`);
  if (card) card.classList.remove('unanswered-flag');
  const task = TEST_DATA.reading.tasks[state.readingTaskIndex];
  updateReadingProgress(task);
}

function updateReadingProgress(task) {
  const total = task.questions.length;
  const answered = task.questions.filter(q => q.id in state.readingAnswers).length;
  const fraction = total ? answered / total : 0;
  renderSectionProgress(TEST_DATA.reading.tasks.length, state.readingTaskIndex, fraction);
}

function buildDotRail(containerId, count) {
  const rail = document.getElementById(containerId);
  rail.innerHTML = '';
  for (let i = 0; i < count; i++) {
    const dot = document.createElement('div');
    dot.className = 'dot';
    rail.appendChild(dot);
  }
}

function attachDotObserver(paneId, cardSelector, railId, stateKey) {
  if (state[stateKey]) state[stateKey].disconnect();

  const pane = document.getElementById(paneId);
  const cards = Array.from(pane.querySelectorAll(cardSelector));
  const dots = Array.from(document.getElementById(railId).children);
  const ratios = new Array(cards.length).fill(0);

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const idx = cards.indexOf(entry.target);
      if (idx !== -1) ratios[idx] = entry.intersectionRatio;
    });
    let best = 0;
    ratios.forEach((r, i) => { if (r > ratios[best]) best = i; });
    dots.forEach((d, i) => d.classList.toggle('active', i === best));
  }, { root: pane, threshold: [0, 0.25, 0.5, 0.75, 1] });

  cards.forEach(c => observer.observe(c));
  state[stateKey] = observer;
}

// ---------------------------------------------------------------------
// Advancing through reading tasks + unanswered-question modal
// ---------------------------------------------------------------------
function attemptAdvanceReadingTask() {
  const task = TEST_DATA.reading.tasks[state.readingTaskIndex];
  const unanswered = task.questions.filter(q => !(q.id in state.readingAnswers));

  if (unanswered.length > 0) {
    unanswered.forEach(q => {
      const card = document.querySelector(`#readingQuestionsPane .q-card[data-qid="${q.id}"]`);
      if (card) card.classList.add('unanswered-flag');
    });
    state.modalConfirmFn = doAdvanceReadingTask;
    document.getElementById('unansweredModal').classList.add('visible');
  } else {
    doAdvanceReadingTask();
  }
}

function doAdvanceReadingTask() {
  document.getElementById('unansweredModal').classList.remove('visible');
  state.readingTaskIndex++;
  if (state.readingTaskIndex < TEST_DATA.reading.tasks.length) {
    renderReadingTask(state.readingTaskIndex);
  } else {
    finishReadingSection();
  }
}

document.getElementById('btnModalBack').addEventListener('click', () => {
  document.getElementById('unansweredModal').classList.remove('visible');
});
document.getElementById('btnModalNext').addEventListener('click', () => {
  if (state.modalConfirmFn) state.modalConfirmFn();
});

function finishReadingSection() {
  clearInterval(state.readingTimerHandle);
  if (state.readingDotObserver) state.readingDotObserver.disconnect();
  showSectionComplete(1, 'Аудирование', () => showScreen('screen-listening-intro'));
}

// ---------------------------------------------------------------------
// Listening section
// ---------------------------------------------------------------------
document.getElementById('btnListeningStart').addEventListener('click', () => {
  state.listeningTaskIndex = 0;
  state.listeningAnswers = {};
  state.listeningRemaining = TEST_DATA.listening.durationSeconds;

  showScreen('screen-listening-task');
  showTopbar('Аудирование');
  renderListeningTask(0);

  clearInterval(state.listeningTimerHandle);
  state.listeningTimerHandle = setInterval(() => {
    state.listeningRemaining--;
    updateTimerDisplay(state.listeningRemaining, TEST_DATA.listening.durationSeconds);
    if (state.listeningRemaining <= 0) {
      clearInterval(state.listeningTimerHandle);
      finishListeningSection();
    }
  }, 1000);
  updateTimerDisplay(state.listeningRemaining, TEST_DATA.listening.durationSeconds);
});

function renderListeningTask(index) {
  const task = TEST_DATA.listening.tasks[index];

  // Same as Reading — start each new task scrolled to the top.
  document.getElementById('listeningPassagePane').scrollTop = 0;
  document.getElementById('listeningQuestionsPane').scrollTop = 0;

  // The previous task's <audio> element is about to be destroyed by the
  // innerHTML rebuild below — pause it first so it doesn't keep playing
  // in the background after it's gone from the DOM.
  const oldAudio = document.querySelector('#listeningPassagePane audio');
  if (oldAudio) oldAudio.pause();

  // ---- Left pane: instructions + custom audio player ----
  const instructionsHtml = task.instructions.replace('{{TWO}}', '<span class="badge-two">TWO</span>');
  let leftHtml = `<p class="task-instructions">${instructionsHtml}</p>`;
  leftHtml += `
    <div class="audio-player">
      <button type="button" class="play-btn" id="playBtn-${task.id}" aria-label="Воспроизвести">▶</button>
      <div class="audio-meta">
        <div class="plays-remaining" id="playsRemaining-${task.id}">Осталось прослушиваний: 2</div>
        <div class="audio-time" id="audioTime-${task.id}">0:00 / 0:00</div>
      </div>
    </div>
    <p class="audio-error" id="audioError-${task.id}">Не удалось загрузить аудиофайл. Добавьте файл <code>${task.audioUrl}</code>, чтобы проверить воспроизведение.</p>
    <audio id="audioEl-${task.id}" src="${task.audioUrl}" preload="metadata"></audio>
  `;
  document.getElementById('listeningPassagePane').innerHTML = leftHtml;

  // ---- Right pane: question cards (radio, 3 or 4 options) ----
  let qHtml = '';
  task.questions.forEach(q => {
    const header = task.headerStyle === 'short'
      ? `Speaker ${q.speaker}`
      : `What is the best response to Speaker ${q.speaker}?`;
    qHtml += `<div class="q-card" data-qid="${q.id}">`;
    qHtml += `<p class="q-text">${escapeHtml(header)}</p>`;
    q.options.forEach((opt, i) => {
      qHtml += `<label class="opt"><input type="radio" name="${q.id}" value="${i}"><span>${escapeHtml(opt)}</span></label>`;
    });
    qHtml += '</div>';
  });
  qHtml += `<div class="task-next-row"><button id="btnListeningNext">Далее</button></div>`;
  document.getElementById('listeningQuestionsPane').innerHTML = qHtml;

  document.querySelectorAll('#listeningQuestionsPane input[type="radio"]').forEach(radio => {
    radio.addEventListener('change', () => {
      const qid = radio.name;
      document.querySelectorAll(`input[name="${qid}"]`).forEach(r => r.closest('.opt').classList.remove('selected'));
      radio.closest('.opt').classList.add('selected');
      recordListeningAnswer(qid, radio.value);
    });
  });

  document.getElementById('btnListeningNext').addEventListener('click', attemptAdvanceListeningTask);

  buildDotRail('listeningDotRail', task.questions.length);
  attachDotObserver('listeningQuestionsPane', '.q-card', 'listeningDotRail', 'listeningDotObserver');

  updateListeningProgress(task);
  setupAudioPlayer(task);
}

function recordListeningAnswer(qid, value) {
  state.listeningAnswers[qid] = value;
  const card = document.querySelector(`#listeningQuestionsPane .q-card[data-qid="${qid}"]`);
  if (card) card.classList.remove('unanswered-flag');
  const task = TEST_DATA.listening.tasks[state.listeningTaskIndex];
  updateListeningProgress(task);
}

function updateListeningProgress(task) {
  const total = task.questions.length;
  const answered = task.questions.filter(q => q.id in state.listeningAnswers).length;
  const fraction = total ? answered / total : 0;
  renderSectionProgress(TEST_DATA.listening.tasks.length, state.listeningTaskIndex, fraction);
}

function attemptAdvanceListeningTask() {
  const task = TEST_DATA.listening.tasks[state.listeningTaskIndex];
  const unanswered = task.questions.filter(q => !(q.id in state.listeningAnswers));

  if (unanswered.length > 0) {
    unanswered.forEach(q => {
      const card = document.querySelector(`#listeningQuestionsPane .q-card[data-qid="${q.id}"]`);
      if (card) card.classList.add('unanswered-flag');
    });
    state.modalConfirmFn = doAdvanceListeningTask;
    document.getElementById('unansweredModal').classList.add('visible');
  } else {
    doAdvanceListeningTask();
  }
}

function doAdvanceListeningTask() {
  document.getElementById('unansweredModal').classList.remove('visible');
  state.listeningTaskIndex++;
  if (state.listeningTaskIndex < TEST_DATA.listening.tasks.length) {
    renderListeningTask(state.listeningTaskIndex);
  } else {
    finishListeningSection();
  }
}

function finishListeningSection() {
  clearInterval(state.listeningTimerHandle);
  if (state.listeningDotObserver) state.listeningDotObserver.disconnect();
  showSectionComplete(2, 'Говорение', () => showScreen('screen-speaking-intro'));
}

// ---- Custom audio player: max two plays, no pausing/seeking mid-play ----
function setupAudioPlayer(task) {
  const audio = document.getElementById(`audioEl-${task.id}`);
  const btn = document.getElementById(`playBtn-${task.id}`);
  const remainingEl = document.getElementById(`playsRemaining-${task.id}`);
  const timeEl = document.getElementById(`audioTime-${task.id}`);
  const errorEl = document.getElementById(`audioError-${task.id}`);
  let remaining = 2;

  audio.volume = state.volume;

  const fmt = (t) => (isFinite(t) ? formatTime(t) : '0:00');

  audio.addEventListener('loadedmetadata', () => {
    timeEl.textContent = `${fmt(0)} / ${fmt(audio.duration)}`;
  });
  audio.addEventListener('timeupdate', () => {
    timeEl.textContent = `${fmt(audio.currentTime)} / ${fmt(audio.duration)}`;
  });
  audio.addEventListener('ended', () => {
    timeEl.textContent = `${fmt(audio.duration)} / ${fmt(audio.duration)}`;
    btn.disabled = remaining <= 0;
  });
  audio.addEventListener('error', () => {
    errorEl.style.display = 'block';
    btn.disabled = true;
  });

  btn.addEventListener('click', () => {
    if (remaining <= 0) return;
    remaining--;
    remainingEl.textContent = `Осталось прослушиваний: ${remaining}`;
    btn.disabled = true;
    try {
      audio.currentTime = 0;
    } catch (e) { /* ignore — duration not known yet */ }
    audio.play().catch(() => {
      errorEl.style.display = 'block';
      btn.disabled = remaining <= 0;
    });
  });
}

// ---------------------------------------------------------------------
// Speaking section
// ---------------------------------------------------------------------

// Shows the reusable "Part intro video" screen (video1-0 / video2-0 /
// video3-0). Plays automatically (best effort, same fallback pattern as
// in-test question videos); "К вопросам!" can be clicked at any time,
// it doesn't wait for the video to finish. onContinue runs once, when
// that button is clicked.
function showPartIntroVideo(videoUrl, onContinue) {
  showScreen('screen-speaking-part-video');
  const video = document.getElementById('partIntroVideo');
  const errorEl = document.getElementById('partIntroVideoError');
  const btn = document.getElementById('btnPartIntroNext');

  errorEl.style.display = 'none';
  video.style.display = 'block';
  video.src = videoUrl;
  video.muted = false;

  video.onerror = () => {
    errorEl.style.display = 'block';
    errorEl.innerHTML = `Не удалось загрузить видео. Добавьте файл <code>${videoUrl}</code>, чтобы проверить воспроизведение.`;
  };

  video.play().catch(() => {
    video.muted = true;
    video.play().catch(() => video.onerror());
  });

  btn.onclick = () => {
    video.pause();
    onContinue();
  };
}

document.getElementById('btnSpeakingStart').addEventListener('click', () => {
  state.speakingIndex = 0;
  state.speakingRecordings = [];
  state.shownPartIntros = {};
  goToSpeakingTask(0);
});

// Shows the Part-intro video before a task if that Part's intro hasn't
// played yet this run, then renders/starts the task itself. Every task
// still gets exactly one question screen — only the three Part-level
// intros are separate screens.
function goToSpeakingTask(index) {
  const task = TEST_DATA.speaking.tasks[index];
  const intro = TEST_DATA.speakingIntros && TEST_DATA.speakingIntros[task.part];

  if (intro && !state.shownPartIntros[task.part]) {
    state.shownPartIntros[task.part] = true;
    showPartIntroVideo(intro.videoUrl, () => {
      showScreen('screen-speaking-task');
      renderSpeakingTask(index);
      startSpeakingSequence(index);
    });
  } else {
    showScreen('screen-speaking-task');
    renderSpeakingTask(index);
    startSpeakingSequence(index);
  }
}

function renderSpeakingTask(index) {
  const task = TEST_DATA.speaking.tasks[index];

  document.getElementById('speakingPartLabel').textContent = `Part ${task.part} / ${task.topic}`;
  document.getElementById('speakingTimer').textContent = '—';
  document.getElementById('speakingStatus').textContent = '';

  // Part 2 gets the cue-card treatment (title + bullet list look like a
  // real IELTS cue card); Parts 1 and 3 keep the plain prompt bubble.
  const promptEl = document.getElementById('speakingPrompt');
  promptEl.textContent = task.prompt;
  promptEl.classList.toggle('cue-card', task.part === 2);

  const video = document.getElementById('speakingVideo');
  video.src = task.videoUrl;
  video.volume = state.volume;
  video.muted = false;
  video.style.display = 'none';
  document.getElementById('speakingVideoError').style.display = 'none';

  // Replay button — hidden until the video has played through once.
  const replayBtn = document.getElementById('btnSpeakingReplay');
  replayBtn.style.display = 'none';
  replayBtn.onclick = () => replaySpeakingVideo(task);

  // The "Следующий вопрос" / "Я закончил(а)…" button is rebound as the
  // sequence progresses (startSpeakingSequence, startPrep,
  // startRecordingAuto) — here it just starts disabled, since this
  // screen always auto-plays straight into that sequence.
  const btn = document.getElementById('btnSpeakingNext');
  btn.disabled = true;
  btn.textContent = 'Следующий вопрос';
  btn.onclick = null;
}

// Plays the current video again on demand (after it already finished
// once) without restarting the countdown/prep/recording sequence —
// just a re-watch, audio included.
function replaySpeakingVideo(task) {
  const video = document.getElementById('speakingVideo');
  const replayBtn = document.getElementById('btnSpeakingReplay');
  replayBtn.style.display = 'none';
  video.muted = false;
  video.currentTime = 0;
  video.play().catch(() => {
    // If the browser still blocks unmuted playback here, there's
    // nothing more we can do without another user gesture — the click
    // on the replay button itself usually satisfies the policy.
  });
  video.onended = () => { replayBtn.style.display = 'inline-flex'; };
}

function startSpeakingSequence(index) {
  const task = TEST_DATA.speaking.tasks[index];
  document.getElementById('btnSpeakingNext').disabled = true;

  const video = document.getElementById('speakingVideo');
  const errorEl = document.getElementById('speakingVideoError');
  const replayBtn = document.getElementById('btnSpeakingReplay');
  replayBtn.style.display = 'none';
  video.style.display = 'block';
  document.getElementById('speakingStatus').textContent = 'Слушайте вопрос…';

  let proceeded = false;
  const proceedToCountdown = () => {
    if (proceeded) return; // guard against both 'ended' and 'error' firing
    proceeded = true;
    replayBtn.style.display = 'inline-flex';
    startCountdown(task);
  };

  video.onended = proceedToCountdown;
  video.onerror = () => {
    errorEl.style.display = 'block';
    errorEl.innerHTML = `Не удалось загрузить видео. Добавьте файл <code>${task.videoUrl}</code>, чтобы проверить воспроизведение.`;
    setTimeout(proceedToCountdown, 800); // keeps the flow testable before the real file exists
  };

  try { video.currentTime = 0; } catch (e) { /* duration not known yet */ }

  // Auto-advancing between questions happens inside a setTimeout, which
  // browsers don't treat as a user gesture — so an unmuted autoplay()
  // call there gets silently blocked (the video plays, but with no
  // sound, and no error is thrown). Try unmuted first; if the browser
  // rejects it, fall back to muted playback and show a one-tap "Включить
  // звук" prompt instead of leaving the student stuck with a mute video.
  video.muted = false;
  video.play().catch(() => {
    video.muted = true;
    document.getElementById('speakingStatus').innerHTML =
      'Звук блокирован браузером — <button type="button" id="btnUnmuteVideo" class="link-btn">нажмите, чтобы включить звук</button>';
    video.play().catch(() => video.onerror());
    const unmuteBtn = document.getElementById('btnUnmuteVideo');
    if (unmuteBtn) {
      unmuteBtn.addEventListener('click', () => {
        video.muted = false;
        document.getElementById('speakingStatus').textContent = 'Слушайте вопрос…';
      });
    }
  });
}

function startCountdown(task) {
  document.getElementById('speakingStatus').textContent =
    task.part === 2 ? 'Начинаем подготовку через:' : 'Запись начнётся через:';
  let remaining = 5;
  document.getElementById('speakingTimer').textContent = String(remaining);

  clearInterval(state.countdownHandle);
  state.countdownHandle = setInterval(() => {
    remaining--;
    document.getElementById('speakingTimer').textContent = String(Math.max(remaining, 0));
    if (remaining <= 0) {
      clearInterval(state.countdownHandle);
      if (task.part === 2) {
        startPrep(task);
      } else {
        startRecordingAuto(task);
      }
    }
  }, 1000);
}

function startPrep(task) {
  document.getElementById('speakingStatus').textContent = 'Время на подготовку…';
  let remaining = task.prepSeconds;
  document.getElementById('speakingTimer').textContent = formatTime(remaining);

  // Same pattern as "Я закончил(а) отвечать!" during recording — lets a
  // student who's ready early skip straight to the recording instead of
  // waiting out the full prep minute.
  const btn = document.getElementById('btnSpeakingNext');
  btn.disabled = false;
  btn.textContent = 'Я закончил(а) готовиться!';
  btn.onclick = () => {
    clearInterval(state.prepHandle);
    playPart2PromptVideo(task);
  };

  clearInterval(state.prepHandle);
  state.prepHandle = setInterval(() => {
    remaining--;
    document.getElementById('speakingTimer').textContent = formatTime(remaining);
    if (remaining <= 0) {
      clearInterval(state.prepHandle);
      playPart2PromptVideo(task);
    }
  }, 1000);
}

// Part 2 only: after prep ends (or is skipped), play video2-2 ("Can
// you start speaking now please?") before recording starts. Recording
// begins the instant this video finishes.
function playPart2PromptVideo(task) {
  const prompt = TEST_DATA.speakingPart2Prompt;
  if (!prompt) {
    startRecordingAuto(task);
    return;
  }

  document.getElementById('btnSpeakingNext').disabled = true;
  document.getElementById('speakingStatus').textContent = '';
  document.getElementById('speakingTimer').textContent = '—';

  const video = document.getElementById('speakingVideo');
  const errorEl = document.getElementById('speakingVideoError');
  const replayBtn = document.getElementById('btnSpeakingReplay');
  replayBtn.style.display = 'none';
  video.style.display = 'block';
  video.src = prompt.videoUrl;
  video.muted = false;

  let proceeded = false;
  const proceedToRecording = () => {
    if (proceeded) return;
    proceeded = true;
    startRecordingAuto(task);
  };

  video.onended = proceedToRecording;
  video.onerror = () => {
    errorEl.style.display = 'block';
    errorEl.innerHTML = `Не удалось загрузить видео. Добавьте файл <code>${prompt.videoUrl}</code>, чтобы проверить воспроизведение.`;
    setTimeout(proceedToRecording, 800);
  };

  try { video.currentTime = 0; } catch (e) { /* duration not known yet */ }
  video.play().catch(() => {
    video.muted = true;
    video.play().catch(() => video.onerror());
  });
}

async function startRecordingAuto(task) {
  document.getElementById('speakingStatus').innerHTML = '<span class="rec-dot"></span><span class="rec-label">ЗАПИСЬ</span>';

  // Active throughout the answer — clicking it ends the recording early,
  // instead of forcing the student to wait out the full time limit.
  const btn = document.getElementById('btnSpeakingNext');
  btn.disabled = false;
  btn.textContent = 'Я закончил(а) отвечать!';
  btn.onclick = () => {
    clearInterval(state.speakHandle);
    finishRecording();
  };

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    state.micStream = stream;
    state.audioChunks = [];
    const recorder = new MediaRecorder(stream);
    state.mediaRecorder = recorder;

    recorder.addEventListener('dataavailable', (e) => state.audioChunks.push(e.data));
    recorder.addEventListener('stop', () => {
      stream.getTracks().forEach(t => t.stop());
      if (state.audioChunks.length > 0) {
        const blob = new Blob(state.audioChunks, { type: recorder.mimeType || 'audio/webm' });
        state.speakingRecordings.push({
          questionId: task.id,
          part: task.part,
          topic: task.topic,
          prompt: task.prompt,
          blob
        });
      }
    });
    recorder.start();

    let remaining = task.speakSeconds;
    document.getElementById('speakingTimer').textContent = formatTime(remaining);
    clearInterval(state.speakHandle);
    state.speakHandle = setInterval(() => {
      remaining--;
      document.getElementById('speakingTimer').textContent = formatTime(remaining);
      if (remaining <= 0) {
        clearInterval(state.speakHandle);
        finishRecording();
      }
    }, 1000);
  } catch (err) {
    console.error('Microphone error:', err);
    document.getElementById('speakingStatus').textContent =
      'Не удалось получить доступ к микрофону. Проверьте разрешения браузера.';
    finishRecording(); // don't leave the student stuck if the mic is blocked
  }
}

function finishRecording() {
  clearInterval(state.speakHandle);
  if (state.mediaRecorder && state.mediaRecorder.state !== 'inactive') {
    state.mediaRecorder.stop();
  }
  document.getElementById('speakingStatus').textContent = 'Запись завершена.';
  document.getElementById('speakingTimer').textContent = '—';

  const btn = document.getElementById('btnSpeakingNext');
  btn.disabled = true;
  btn.textContent = 'Следующий вопрос';
  btn.onclick = null;

  // Fully automatic from here — no extra click needed. A short pause so
  // the student sees "Запись завершена" before the next video starts.
  const isLast = state.speakingIndex >= TEST_DATA.speaking.tasks.length - 1;
  setTimeout(() => {
    if (isLast) {
      showScreen('screen-finish');
      playOutroVideo();
      submitReport();
    } else {
      state.speakingIndex++;
      // Routed through goToSpeakingTask (not a direct render+start) so
      // that if the next question starts a new Part, that Part's intro
      // video screen is shown first.
      goToSpeakingTask(state.speakingIndex);
    }
  }, 1200);
}

// Plays video3-7 ("Well done") on the Finish screen, right after the
// last Speaking answer is submitted. Best-effort autoplay with sound,
// same fallback pattern as the in-test question videos — this isn't
// the very first interaction on the page (the student just clicked
// through several screens to get here), so attempting unmuted first
// is reasonable.
function playOutroVideo() {
  const video = document.getElementById('outroVideo');
  if (!video || !TEST_DATA.speakingOutro) return;
  video.src = TEST_DATA.speakingOutro.videoUrl;
  video.muted = false;
  video.play().catch(() => {
    video.muted = true;
    video.play().catch(() => {});
  });
}

// ---------------------------------------------------------------------
// Scoring — used to build the report sent to the teacher
// ---------------------------------------------------------------------
function computeSectionScore(sectionKey) {
  const tasks = TEST_DATA[sectionKey].tasks;
  const answers = sectionKey === 'reading' ? state.readingAnswers : state.listeningAnswers;
  let correct = 0;
  let total = 0;
  const breakdown = [];

  tasks.forEach((task) => {
    task.questions.forEach((q) => {
      total++;
      const raw = answers[q.id];
      const answered = raw !== undefined;
      let studentAnswer, correctAnswer, isCorrect;

      if (task.type === 'match3') {
        // raw is already the chosen label ("Passage A" / "Passage B" / "Both Passages")
        studentAnswer = answered ? raw : null;
        correctAnswer = q.answer;
        isCorrect = answered && raw === q.answer;
      } else {
        // raw is the chosen option's index, as a string (radio input value)
        const idx = answered ? Number(raw) : null;
        studentAnswer = answered ? q.options[idx] : null;
        correctAnswer = q.options[q.answer];
        isCorrect = answered && idx === q.answer;
      }

      if (isCorrect) correct++;
      breakdown.push({
        questionText: q.text || (q.speaker ? `Speaker ${q.speaker}: ${q.line}` : q.line) || '',
        studentAnswer,
        correctAnswer,
        isCorrect
      });
    });
  });

  return {
    correct,
    total,
    percent: total ? Math.round((correct / total) * 100) : 0,
    breakdown
  };
}

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result.split(',')[1]); // strip "data:...;base64,"
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// Uploads every recorded answer to Supabase Storage, then sends the full
// report (student info + Reading/Listening scores + Speaking recording
// links) to the teacher's email via a Netlify Function. Both endpoints
// are server-side (netlify/functions/) since they need secret credentials
// that must never live in the browser.
async function submitReport() {
  state.reportStatus = 'sending';
  renderReportStatus();

  try {
    const sessionId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    const speaking = [];
    for (const rec of state.speakingRecordings) {
      const base64 = await blobToBase64(rec.blob);
      const uploadRes = await fetch('/.netlify/functions/upload-recording', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          questionId: rec.questionId,
          mimeType: rec.blob.type || 'audio/webm',
          audioBase64: base64
        })
      });
      if (!uploadRes.ok) throw new Error(`Upload failed for ${rec.questionId}`);
      const { url } = await uploadRes.json();
      speaking.push({ part: rec.part, topic: rec.topic, prompt: rec.prompt, audioUrl: url });
    }

    const payload = {
      student: state.studentInfo,
      reading: computeSectionScore('reading'),
      listening: computeSectionScore('listening'),
      speaking
    };

    const sendRes = await fetch('/.netlify/functions/send-report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!sendRes.ok) throw new Error('send-report failed');

    state.reportStatus = 'sent';
  } catch (err) {
    console.error('Report submission error:', err);
    state.reportStatus = 'error';
  }
  renderReportStatus();
}

function renderReportStatus() {
  const el = document.getElementById('reportStatus');
  if (!el) return;
  if (state.reportStatus === 'sending') {
    el.textContent = 'Отправляем результаты преподавателю…';
  } else if (state.reportStatus === 'sent') {
    el.textContent = 'Результаты отправлены преподавателю.';
  } else if (state.reportStatus === 'error') {
    el.textContent = 'Не удалось отправить результаты автоматически — преподаватель проверит их вручную.';
  } else {
    el.textContent = '';
  }
}

// ---------------------------------------------------------------------
// Finish
// ---------------------------------------------------------------------
document.getElementById('btnRestart').addEventListener('click', () => {
  location.reload();
});
