/* ===== Math Practice P3-P4 — Main App ===== */
(function () {
  "use strict";

  const STORAGE_KEY = "mathPracticeP34_v1";
  const QUESTIONS_PER_ROUND = 10;

  const MODE_META = {
    mul:  { emoji: "⚡", name: "คูณเร็ว",   desc: "ท่องสูตรคูณและคูณเลขเร็ว", color: "mul" },
    div:  { emoji: "🎯", name: "หารแม่น",   desc: "หารลงตัว และหารมีเศษ", color: "div" },
    frac: { emoji: "🍕", name: "เศษส่วนสนุก", desc: "อ่าน เทียบ บวกลบเศษส่วน", color: "frac" },
    dec:  { emoji: "🔍", name: "ทศนิยมนักสืบ", desc: "ค่าประจำหลัก เทียบ บวกลบ", color: "dec" },
    mix:  { emoji: "🌟", name: "ท้าทายรวม", desc: "ผสมทุกเรื่อง สุ่มมาให้ฝึก", color: "mix" },
  };

  const PRAISE = [
    "เก่งมาก! ⭐", "เยี่ยมเลย!", "สุดยอด!", "ถูกต้อง! 🎉",
    "เก่งจัง!", "ยอดเยี่ยม!", "ฉลาดมาก!", "สุดยอดไปเลย!",
    "เก่งมาก ๆ!", "ทำได้ดีมาก!",
  ];
  const ENCOURAGE = [
    "ไม่เป็นไร ลองใหม่นะ!", "เกือบแล้ว!", "ครั้งหน้าจะได้แน่!",
    "สู้ ๆ นะ!", "มาดูคำตอบกัน",
  ];

  /* ---------- State ---------- */
  let state = {
    grade: "p3",
    difficulty: "medium",
    sound: true,
    screen: "home",
    mode: null,
    round: null, // { questions answered, score, streak, bestStreak, correct, wrong, qIndex }
    currentQ: null,
    answered: false,
    inputBuffer: "",
  };

  let progress = loadProgress();

  function defaultProgress() {
    return {
      totalStars: 0,
      totalPoints: 0,
      highScores: { mul: 0, div: 0, frac: 0, dec: 0, mix: 0 },
      stars: { mul: 0, div: 0, frac: 0, dec: 0, mix: 0 },
      played: { mul: 0, div: 0, frac: 0, dec: 0, mix: 0 },
      unlocked: { mul: true, div: true, frac: true, dec: true, mix: false },
      settings: { sound: true, grade: "p3", difficulty: "medium" },
    };
  }

  function loadProgress() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return defaultProgress();
      return { ...defaultProgress(), ...JSON.parse(raw) };
    } catch {
      return defaultProgress();
    }
  }

  function saveProgress() {
    progress.settings = {
      sound: state.sound,
      grade: state.grade,
      difficulty: state.difficulty,
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    } catch (_) { /* ignore */ }
  }

  /* ---------- Sound (Web Audio beeps — no files needed) ---------- */
  let audioCtx = null;

  function ensureAudio() {
    if (!audioCtx) {
      try {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      } catch (_) { return null; }
    }
    if (audioCtx.state === "suspended") audioCtx.resume();
    return audioCtx;
  }

  function beep(freq, dur, type, vol) {
    if (!state.sound) return;
    const ctx = ensureAudio();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type || "sine";
    osc.frequency.value = freq;
    gain.gain.value = vol || 0.12;
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + dur);
  }

  function soundCorrect() {
    beep(523, 0.1, "sine", 0.15);
    setTimeout(() => beep(659, 0.1, "sine", 0.15), 80);
    setTimeout(() => beep(784, 0.15, "sine", 0.15), 160);
  }

  function soundWrong() {
    beep(200, 0.2, "triangle", 0.12);
    setTimeout(() => beep(150, 0.25, "triangle", 0.1), 120);
  }

  function soundClick() {
    beep(400, 0.05, "square", 0.06);
  }

  function soundLevelUp() {
    [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => beep(f, 0.15, "sine", 0.12), i * 100));
  }

  /* ---------- DOM helpers ---------- */
  const $ = (sel, el = document) => el.querySelector(sel);
  const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];

  function showScreen(name) {
    state.screen = name;
    $$(".screen").forEach((s) => s.classList.toggle("active", s.dataset.screen === name));
  }

  function starsHtml(n) {
    const filled = Math.min(3, Math.max(0, n));
    return "★".repeat(filled) + "☆".repeat(3 - filled);
  }

  /* ---------- Home ---------- */
  function renderHome() {
    showScreen("home");
    updateHeaderStats();

    // chips
    $$("[data-grade]").forEach((c) => {
      c.classList.toggle("selected", c.dataset.grade === state.grade);
    });
    $$("[data-diff]").forEach((c) => {
      c.classList.toggle("selected", c.dataset.diff === state.difficulty);
    });

    // unlock mix if any mode has 5+ plays or 2+ stars
    const totalPlays = Object.values(progress.played).reduce((a, b) => a + b, 0);
    if (totalPlays >= 3 || progress.totalStars >= 3) {
      progress.unlocked.mix = true;
      saveProgress();
    }

    const grid = $("#modesGrid");
    grid.innerHTML = "";
    Object.keys(MODE_META).forEach((key) => {
      const m = MODE_META[key];
      const unlocked = progress.unlocked[key];
      const btn = document.createElement("button");
      btn.className = `mode-card ${m.color}`;
      btn.type = "button";
      btn.disabled = !unlocked;
      if (!unlocked) {
        btn.style.opacity = "0.55";
        btn.innerHTML = `
          <span class="mode-emoji">🔒</span>
          <h3>${m.name}</h3>
          <p>เล่นโหมดอื่นให้ได้ดาวก่อนนะ!</p>
        `;
      } else {
        btn.innerHTML = `
          <span class="mode-emoji">${m.emoji}</span>
          <h3>${m.name}</h3>
          <p>${m.desc}</p>
          <div class="mode-stars">${starsHtml(progress.stars[key])} · สูงสุด ${progress.highScores[key]} คะแนน</div>
        `;
        btn.addEventListener("click", () => {
          soundClick();
          startGame(key);
        });
      }
      grid.appendChild(btn);
    });

    // progress bars
    const bars = $("#progressBars");
    bars.innerHTML = "";
    ["mul", "div", "frac", "dec", "mix"].forEach((key) => {
      if (!progress.unlocked[key] && key === "mix") return;
      const pct = Math.min(100, (progress.stars[key] / 3) * 100 + Math.min(40, progress.played[key] * 4));
      const row = document.createElement("div");
      row.className = "progress-item";
      row.innerHTML = `
        <span>${MODE_META[key].emoji} ${MODE_META[key].name}</span>
        <div class="bar-track"><div class="bar-fill ${key}" style="width:${pct}%"></div></div>
        <span>${progress.highScores[key]}</span>
      `;
      bars.appendChild(row);
    });

    $("#soundBtn").classList.toggle("active", state.sound);
    $("#soundBtn").textContent = state.sound ? "🔊" : "🔇";
    $("#soundBtn").title = state.sound ? "ปิดเสียง" : "เปิดเสียง";
  }

  function updateHeaderStats() {
    $("#statStars").textContent = progress.totalStars;
    $("#statPoints").textContent = progress.totalPoints;
  }

  /* ---------- Game ---------- */
  let timerId = null;
  let timeLeft = 0;

  function startGame(mode) {
    clearTimer();
    state.mode = mode;
    state.round = {
      score: 0,
      streak: 0,
      bestStreak: 0,
      correct: 0,
      wrong: 0,
      qIndex: 0,
      total: QUESTIONS_PER_ROUND,
      timed: mode === "mul" || mode === "mix",
    };
    state.answered = false;
    state.inputBuffer = "";
    showScreen("game");

    const meta = MODE_META[mode];
    $("#gameTitle").textContent = `${meta.emoji} ${meta.name}`;
    nextQuestion();
  }

  function clearTimer() {
    if (timerId) {
      clearInterval(timerId);
      timerId = null;
    }
  }

  function startTimer(seconds) {
    clearTimer();
    timeLeft = seconds;
    updateTimerHud();
    timerId = setInterval(() => {
      timeLeft--;
      updateTimerHud();
      if (timeLeft <= 0) {
        clearTimer();
        if (!state.answered) {
          // time up = wrong
          handleAnswer(null, true);
        }
      }
    }, 1000);
  }

  function updateTimerHud() {
    const el = $("#hudTimer");
    if (!state.round?.timed) {
      el.style.display = "none";
      return;
    }
    el.style.display = "flex";
    el.classList.toggle("urgent", timeLeft <= 5);
    el.innerHTML = `⏱️ <span>${timeLeft}</span>`;
  }

  function updateGameHud() {
    const r = state.round;
    $("#hudScore").innerHTML = `⭐ <span>${r.score}</span>`;
    $("#hudStreak").innerHTML = r.streak >= 3
      ? `<span class="streak-fire">🔥</span> <span>${r.streak}</span>`
      : `🔥 <span>${r.streak}</span>`;
    $("#hudProgress").textContent = `${r.qIndex}/${r.total}`;
    updateTimerHud();
  }

  function nextQuestion() {
    state.answered = false;
    state.inputBuffer = "";
    const r = state.round;
    if (r.qIndex >= r.total) {
      endRound();
      return;
    }
    r.qIndex++;
    state.currentQ = MathQuestions.generate(state.mode, state.grade, state.difficulty);
    updateGameHud();
    renderQuestion(state.currentQ);

    if (r.timed) {
      const secs = state.difficulty === "easy" ? 20 : state.difficulty === "medium" ? 15 : 12;
      startTimer(secs);
    } else {
      clearTimer();
      $("#hudTimer").style.display = "none";
    }
  }

  function renderQuestion(q) {
    const card = $("#questionCard");
    const badge = q.prompt || "";
    $("#qBadge").textContent = `ข้อ ${state.round.qIndex}/${state.round.total}`;
    $("#qPrompt").textContent = badge;

    let exprHtml = `<div class="q-expression">${escapeHtml(q.expression)}</div>`;
    if (q.compare) {
      exprHtml = `
        <div class="compare-row">
          <div class="compare-box">${escapeHtml(q.compare[0])}</div>
          <span style="font-size:1.8rem;color:var(--text-muted)">□</span>
          <div class="compare-box">${escapeHtml(q.compare[1])}</div>
        </div>`;
    }

    $("#qExpression").innerHTML = exprHtml;
    $("#qVisual").innerHTML = renderVisual(q.visual);
    $("#feedbackBox").innerHTML = "";
    $("#feedbackBox").className = "feedback";
    $("#feedbackBox").style.display = "none";
    $("#nextBtnWrap").style.display = "none";

    const ans = $("#answerArea");
    if (q.choices && q.choices.length) {
      const layout = q.choicesLayout === "row" ? "choices" : "choices";
      ans.innerHTML = `<div class="${layout}" id="choiceGrid"></div>`;
      const grid = $("#choiceGrid");
      if (q.choicesLayout === "row") {
        grid.style.gridTemplateColumns = `repeat(${q.choices.length}, 1fr)`;
      }
      q.choices.forEach((c) => {
        const b = document.createElement("button");
        b.className = "choice-btn";
        b.type = "button";
        b.textContent = String(c);
        b.addEventListener("click", () => {
          if (state.answered) return;
          soundClick();
          handleAnswer(c);
        });
        grid.appendChild(b);
      });
    } else {
      // input + numpad
      const isFrac = q.type === "frac" && q.subtype !== "compare";
      if (isFrac && !q.choices) {
        ans.innerHTML = `
          <div class="answer-input-row">
            <div class="frac-input-stack">
              <input class="answer-input frac-num" id="fracNum" inputmode="numeric" placeholder="เศษ" maxlength="3" />
              <div class="frac-line"></div>
              <input class="answer-input frac-den" id="fracDen" inputmode="numeric" placeholder="ส่วน" maxlength="3" />
            </div>
            <button class="btn-primary" type="button" id="submitBtn">ตรวจ ✓</button>
          </div>`;
      } else {
        ans.innerHTML = `
          <div class="answer-input-row">
            <input class="answer-input" id="ansInput" inputmode="decimal" placeholder="?" maxlength="10" autocomplete="off" />
            <button class="btn-primary" type="button" id="submitBtn">ตรวจ ✓</button>
          </div>
          <div class="numpad" id="numpad"></div>`;
        buildNumpad();
      }
      const submit = () => {
        if (state.answered) return;
        let val;
        if ($("#fracNum")) {
          const n = $("#fracNum").value.trim();
          const d = $("#fracDen").value.trim();
          if (!n || !d) return;
          val = `${n}/${d}`;
        } else {
          val = ($("#ansInput")?.value || state.inputBuffer).trim();
        }
        if (!val) return;
        soundClick();
        handleAnswer(val);
      };
      $("#submitBtn")?.addEventListener("click", submit);
      $("#ansInput")?.addEventListener("keydown", (e) => {
        if (e.key === "Enter") submit();
      });
      $("#fracDen")?.addEventListener("keydown", (e) => {
        if (e.key === "Enter") submit();
      });
      setTimeout(() => $("#ansInput")?.focus() || $("#fracNum")?.focus(), 50);
    }
  }

  function buildNumpad() {
    const pad = $("#numpad");
    if (!pad) return;
    const keys = ["1","2","3","4","5","6","7","8","9",".","0","⌫"];
    keys.forEach((k) => {
      const b = document.createElement("button");
      b.type = "button";
      b.textContent = k;
      if (k === "⌫") b.className = "np-del";
      b.addEventListener("click", () => {
        if (state.answered) return;
        const input = $("#ansInput");
        if (!input) return;
        if (k === "⌫") {
          input.value = input.value.slice(0, -1);
        } else if (k === "." && input.value.includes(".")) {
          return;
        } else {
          if (input.value.length < 10) input.value += k;
        }
        state.inputBuffer = input.value;
        soundClick();
      });
      pad.appendChild(b);
    });
    // OK row
    const ok = document.createElement("button");
    ok.type = "button";
    ok.className = "np-ok";
    ok.textContent = "✓";
    ok.style.gridColumn = "1 / -1";
    ok.addEventListener("click", () => {
      if (state.answered) return;
      const val = ($("#ansInput")?.value || "").trim();
      if (!val) return;
      soundClick();
      handleAnswer(val);
    });
    pad.appendChild(ok);
  }

  function renderVisual(visual) {
    if (!visual) return "";
    if (visual.kind === "bar") {
      return fracBar(visual.num, visual.den) + `<div class="pie-label">ระบาย ${visual.num} จาก ${visual.den} ส่วน</div>`;
    }
    if (visual.kind === "bars" && visual.pairs) {
      return `<div class="pie-wrap">${visual.pairs.map(([n,d], i) =>
        `<div>${fracBar(n, d, i === 1)}${`<div class="pie-label">${n}/${d}</div>`}</div>`
      ).join("")}</div>`;
    }
    if (visual.kind === "pie") {
      return pieSvg(visual.num, visual.den);
    }
    return "";
  }

  function fracBar(num, den, alt) {
    let segs = "";
    for (let i = 0; i < den; i++) {
      const filled = i < num ? (alt ? "filled-alt" : "filled") : "";
      segs += `<div class="frac-seg ${filled}"></div>`;
    }
    return `<div class="frac-bar">${segs}</div>`;
  }

  function pieSvg(num, den) {
    const colors = ["#a78bfa", "#f472b6", "#60a5fa", "#34d399", "#fb923c", "#ffe66d", "#4ecdc4", "#ff6b4a"];
    const r = 48, cx = 50, cy = 50;
    let paths = "";
    for (let i = 0; i < den; i++) {
      const a0 = (i / den) * Math.PI * 2 - Math.PI / 2;
      const a1 = ((i + 1) / den) * Math.PI * 2 - Math.PI / 2;
      const x0 = cx + r * Math.cos(a0);
      const y0 = cy + r * Math.sin(a0);
      const x1 = cx + r * Math.cos(a1);
      const y1 = cy + r * Math.sin(a1);
      const large = den === 1 ? 1 : 0;
      const fill = i < num ? colors[i % colors.length] : "#fff";
      paths += `<path d="M${cx},${cy} L${x0},${y0} A${r},${r} 0 ${large} 1 ${x1},${y1} Z" fill="${fill}" stroke="#2d3436" stroke-width="1.5"/>`;
    }
    return `<svg class="pie" viewBox="0 0 100 100" width="100" height="100">${paths}</svg>`;
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function handleAnswer(userAnswer, timedOut) {
    if (state.answered) return;
    state.answered = true;
    clearTimer();

    const q = state.currentQ;
    const r = state.round;
    const ok = !timedOut && MathQuestions.checkAnswer(q, userAnswer);

    // disable choices
    $$(".choice-btn").forEach((b) => {
      b.disabled = true;
      if (String(b.textContent) === String(q.answer)) b.classList.add("correct");
      else if (ok === false && String(b.textContent) === String(userAnswer)) b.classList.add("wrong");
    });
    if ($("#ansInput")) $("#ansInput").disabled = true;
    if ($("#fracNum")) { $("#fracNum").disabled = true; $("#fracDen").disabled = true; }
    if ($("#submitBtn")) $("#submitBtn").disabled = true;

    const fb = $("#feedbackBox");
    fb.style.display = "block";

    if (ok) {
      r.correct++;
      r.streak++;
      r.bestStreak = Math.max(r.bestStreak, r.streak);
      const streakBonus = Math.min(50, (r.streak - 1) * 5);
      const timeBonus = r.timed ? Math.max(0, timeLeft * 2) : 0;
      const base = state.difficulty === "easy" ? 10 : state.difficulty === "medium" ? 15 : 20;
      const gained = base + streakBonus + timeBonus;
      r.score += gained;
      soundCorrect();
      fb.className = "feedback ok";
      fb.innerHTML = `
        <div>${pick(PRAISE)} <strong>+${gained}</strong> คะแนน</div>
        ${r.streak >= 3 ? `<div class="explain">🔥 ต่อเนื่อง ${r.streak} ข้อ!</div>` : ""}
      `;
      if (r.streak === 5 || r.streak === 10) spawnConfetti();
    } else {
      r.wrong++;
      r.streak = 0;
      soundWrong();
      fb.className = "feedback bad";
      const msg = timedOut ? "หมดเวลาแล้ว!" : pick(ENCOURAGE);
      fb.innerHTML = `
        <div>${msg}</div>
        <div class="explain">คำตอบที่ถูก: <strong>${escapeHtml(String(q.answer))}</strong></div>
        <div class="explain">${escapeHtml(q.explain || "")}</div>
      `;
    }

    updateGameHud();
    $("#nextBtnWrap").style.display = "flex";
  }

  function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function spawnConfetti() {
    const emojis = ["⭐", "🎉", "✨", "🌟", "💛", "🧡"];
    for (let i = 0; i < 12; i++) {
      const el = document.createElement("div");
      el.className = "confetti-piece";
      el.textContent = pick(emojis);
      el.style.left = `${10 + Math.random() * 80}vw`;
      el.style.top = `${40 + Math.random() * 30}vh`;
      el.style.animationDelay = `${Math.random() * 0.3}s`;
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 1400);
    }
  }

  function endRound() {
    clearTimer();
    const r = state.round;
    const mode = state.mode;
    const accuracy = r.total ? r.correct / r.total : 0;

    // stars: 1 if >=50%, 2 if >=70%, 3 if >=90%
    let earned = 0;
    if (accuracy >= 0.9) earned = 3;
    else if (accuracy >= 0.7) earned = 2;
    else if (accuracy >= 0.5) earned = 1;

    const prevStars = progress.stars[mode] || 0;
    if (earned > prevStars) {
      progress.totalStars += earned - prevStars;
      progress.stars[mode] = earned;
    }
    if (r.score > (progress.highScores[mode] || 0)) {
      progress.highScores[mode] = r.score;
    }
    progress.totalPoints += r.score;
    progress.played[mode] = (progress.played[mode] || 0) + 1;

    if (progress.stars.mul + progress.stars.div + progress.stars.frac + progress.stars.dec >= 4) {
      progress.unlocked.mix = true;
    }
    if (Object.values(progress.played).reduce((a, b) => a + b, 0) >= 3) {
      progress.unlocked.mix = true;
    }

    saveProgress();
    soundLevelUp();
    if (earned >= 2) spawnConfetti();

    showScreen("result");
    const titles = [
      { min: 0.9, emoji: "🏆", title: "สุดยอดอัจฉริยะ!" },
      { min: 0.7, emoji: "🌟", title: "เก่งมากเลย!" },
      { min: 0.5, emoji: "👍", title: "ทำได้ดี!" },
      { min: 0, emoji: "💪", title: "สู้ต่อไปนะ!" },
    ];
    const t = titles.find((x) => accuracy >= x.min);
    $("#resultEmoji").textContent = t.emoji;
    $("#resultTitle").textContent = t.title;
    $("#resultScore").textContent = r.score;
    $("#resultStars").textContent = starsHtml(earned);
    $("#resultCorrect").textContent = r.correct;
    $("#resultWrong").textContent = r.wrong;
    $("#resultStreak").textContent = r.bestStreak;
    $("#resultModeLabel").textContent = MODE_META[mode].name;

    const highNote = r.score >= progress.highScores[mode] && r.score > 0
      ? `<p style="color:var(--primary);font-weight:700;margin-top:0.5rem;">🏅 คะแนนสูงสุดใหม่!</p>`
      : `<p style="color:var(--text-muted);margin-top:0.5rem;">คะแนนสูงสุด: ${progress.highScores[mode]}</p>`;
    $("#resultHigh").innerHTML = highNote;
  }

  /* ---------- Help modal ---------- */
  function openHelp() {
    $("#helpModal").classList.add("open");
  }
  function closeHelp() {
    $("#helpModal").classList.remove("open");
  }

  function resetProgressConfirm() {
    if (confirm("ล้างคะแนนและดาวทั้งหมด? การกระทำนี้ย้อนกลับไม่ได้")) {
      progress = defaultProgress();
      progress.settings.sound = state.sound;
      progress.settings.grade = state.grade;
      progress.settings.difficulty = state.difficulty;
      saveProgress();
      renderHome();
      closeHelp();
    }
  }

  /* ---------- Init ---------- */
  function init() {
    // restore settings
    state.sound = progress.settings?.sound !== false;
    state.grade = progress.settings?.grade || "p3";
    state.difficulty = progress.settings?.difficulty || "medium";

    // grade chips
    $$("[data-grade]").forEach((c) => {
      c.addEventListener("click", () => {
        soundClick();
        state.grade = c.dataset.grade;
        saveProgress();
        renderHome();
      });
    });
    $$("[data-diff]").forEach((c) => {
      c.addEventListener("click", () => {
        soundClick();
        state.difficulty = c.dataset.diff;
        saveProgress();
        renderHome();
      });
    });

    $("#soundBtn").addEventListener("click", () => {
      state.sound = !state.sound;
      saveProgress();
      if (state.sound) soundClick();
      renderHome();
    });

    $("#helpBtn").addEventListener("click", () => { soundClick(); openHelp(); });
    $("#helpClose").addEventListener("click", closeHelp);
    $("#helpModal").addEventListener("click", (e) => {
      if (e.target === $("#helpModal")) closeHelp();
    });
    $("#resetProgressBtn")?.addEventListener("click", resetProgressConfirm);

    $("#btnBackHome").addEventListener("click", () => {
      soundClick();
      clearTimer();
      if (state.round && state.round.qIndex > 1 && !confirm("ออกจากเกม? คะแนนรอบนี้จะไม่ถูกบันทึก")) return;
      renderHome();
    });

    $("#btnNext").addEventListener("click", () => {
      soundClick();
      nextQuestion();
    });

    $("#btnPlayAgain").addEventListener("click", () => {
      soundClick();
      startGame(state.mode);
    });

    $("#btnResultHome").addEventListener("click", () => {
      soundClick();
      renderHome();
    });

    renderHome();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
