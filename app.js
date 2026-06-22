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

  speakingIndex: 0,
  prepHandle: null,
  speakHandle: null,
  mediaRecorder: null,
  audioChunks: [],
  micStream: null,

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
  document.querySelectorAll('.screen').forEach(el => el.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  document.getElementById('topbar').classList.remove('visible');
}

function showTopbar(label) {
  document.getElementById('topbarLabel').textContent = label;
  document.getElementById('topbar').classList.add('visible');
}

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
  showScreen('screen-welcome');
});

// ---------------------------------------------------------------------
// Screen 2 → 3: Welcome
// ---------------------------------------------------------------------
document.getElementById('btnWelcomeNext').addEventListener('click', () => {
  showScreen('screen-audio');
});

// ---------------------------------------------------------------------
// Screen 3: Audio check
// ---------------------------------------------------------------------
const audioCheckEl = document.getElementById('audioCheckEl');
audioCheckEl.src = TEST_DATA.audioCheck.audioUrl;

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
    document.getElementById('topbarTimer').textContent = formatTime(state.readingRemaining);
    if (state.readingRemaining <= 0) {
      clearInterval(state.readingTimerHandle);
      finishReadingSection();
    }
  }, 1000);
  document.getElementById('topbarTimer').textContent = formatTime(state.readingRemaining);
});

// ---------------------------------------------------------------------
// Reading task rendering
// ---------------------------------------------------------------------
function renderReadingTask(index) {
  const task = TEST_DATA.reading.tasks[index];

  // ---- Left pane: instructions + passage(s) ----
  let passageHtml = `<p class="task-instructions">${task.instructions}</p>`;
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
  const pct = total ? Math.round((answered / total) * 100) : 0;
  document.getElementById('topbarProgress').style.width = pct + '%';
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
  showScreen('screen-reading-complete');
}

// ---------------------------------------------------------------------
// Listening section
// ---------------------------------------------------------------------
document.getElementById('btnGoListening').addEventListener('click', () => {
  showScreen('screen-listening-intro');
});

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
    document.getElementById('topbarTimer').textContent = formatTime(state.listeningRemaining);
    if (state.listeningRemaining <= 0) {
      clearInterval(state.listeningTimerHandle);
      finishListeningSection();
    }
  }, 1000);
  document.getElementById('topbarTimer').textContent = formatTime(state.listeningRemaining);
});

function renderListeningTask(index) {
  const task = TEST_DATA.listening.tasks[index];

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
  const pct = total ? Math.round((answered / total) * 100) : 0;
  document.getElementById('topbarProgress').style.width = pct + '%';
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
  showScreen('screen-listening-complete');
}

document.getElementById('btnGoSpeaking').addEventListener('click', () => {
  showScreen('screen-speaking-intro');
});

// ---- Custom audio player: max two plays, no pausing/seeking mid-play ----
function setupAudioPlayer(task) {
  const audio = document.getElementById(`audioEl-${task.id}`);
  const btn = document.getElementById(`playBtn-${task.id}`);
  const remainingEl = document.getElementById(`playsRemaining-${task.id}`);
  const timeEl = document.getElementById(`audioTime-${task.id}`);
  const errorEl = document.getElementById(`audioError-${task.id}`);
  let remaining = 2;

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
document.getElementById('btnSpeakingStart').addEventListener('click', () => {
  state.speakingIndex = 0;
  showScreen('screen-speaking-task');
  renderSpeakingTask(0);
});

function renderSpeakingTask(index) {
  const task = TEST_DATA.speaking.tasks[index];

  document.getElementById('speakingPartLabel').textContent = `Part ${task.part}`;
  document.getElementById('speakingPrompt').textContent = task.prompt;
  document.getElementById('speakingTimer').textContent = formatTime(task.prepSeconds);
  document.getElementById('speakingStatus').textContent = 'Нажмите «Начать подготовку», когда будете готовы.';

  const btnPrep = document.getElementById('btnPrepStart');
  const btnRecStart = document.getElementById('btnRecordStart');
  const btnRecStop = document.getElementById('btnRecordStop');
  const btnSubmit = document.getElementById('btnSpeakingSubmit');

  btnPrep.disabled = false;
  btnRecStart.disabled = true;
  btnRecStop.disabled = true;
  btnSubmit.disabled = true;

  btnPrep.onclick = () => startPrep(task);
  btnRecStart.onclick = () => startRecording(task);
  btnRecStop.onclick = stopRecording;
  btnSubmit.onclick = () => submitSpeakingAnswer(index);
}

function startPrep(task) {
  document.getElementById('btnPrepStart').disabled = true;
  document.getElementById('speakingStatus').textContent = 'Подготовьтесь к ответу…';

  let remaining = task.prepSeconds;
  document.getElementById('speakingTimer').textContent = formatTime(remaining);

  clearInterval(state.prepHandle);
  state.prepHandle = setInterval(() => {
    remaining--;
    document.getElementById('speakingTimer').textContent = formatTime(remaining);
    if (remaining <= 0) {
      clearInterval(state.prepHandle);
      document.getElementById('speakingTimer').textContent = 'Говорите!';
      document.getElementById('speakingStatus').textContent = 'Время отвечать — нажмите «Записать ответ».';
      document.getElementById('btnRecordStart').disabled = false;
    }
  }, 1000);
}

async function startRecording(task) {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    state.micStream = stream;
    state.audioChunks = [];
    const recorder = new MediaRecorder(stream);
    state.mediaRecorder = recorder;

    recorder.addEventListener('dataavailable', (e) => state.audioChunks.push(e.data));
    recorder.addEventListener('stop', () => {
      stream.getTracks().forEach(t => t.stop());
      document.getElementById('btnSpeakingSubmit').disabled = false;
    });

    recorder.start();
    document.getElementById('btnRecordStart').disabled = true;
    document.getElementById('btnRecordStop').disabled = false;
    document.getElementById('speakingStatus').innerHTML = '<span class="rec-dot"></span>Идёт запись…';

    let remaining = task.speakSeconds;
    document.getElementById('speakingTimer').textContent = formatTime(remaining);
    clearInterval(state.speakHandle);
    state.speakHandle = setInterval(() => {
      remaining--;
      document.getElementById('speakingTimer').textContent = formatTime(remaining);
      if (remaining <= 0) {
        clearInterval(state.speakHandle);
        stopRecording();
      }
    }, 1000);
  } catch (err) {
    console.error('Microphone error:', err);
    document.getElementById('speakingStatus').textContent =
      'Не удалось получить доступ к микрофону. Проверьте разрешения браузера и попробуйте снова.';
    document.getElementById('btnRecordStart').disabled = false;
  }
}

function stopRecording() {
  clearInterval(state.speakHandle);
  if (state.mediaRecorder && state.mediaRecorder.state !== 'inactive') {
    state.mediaRecorder.stop();
  }
  document.getElementById('btnRecordStop').disabled = true;
  document.getElementById('speakingStatus').textContent = 'Запись завершена.';
}

function submitSpeakingAnswer(index) {
  document.getElementById('btnSpeakingSubmit').disabled = true;
  document.getElementById('speakingStatus').textContent = 'Ответ сохранён. Переходим к следующему заданию…';

  setTimeout(() => {
    const next = index + 1;
    if (next < TEST_DATA.speaking.tasks.length) {
      state.speakingIndex = next;
      renderSpeakingTask(next);
    } else {
      showScreen('screen-finish');
    }
  }, 700);
}

// ---------------------------------------------------------------------
// Finish
// ---------------------------------------------------------------------
document.getElementById('btnRestart').addEventListener('click', () => {
  location.reload();
});
