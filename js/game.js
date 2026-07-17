(function () {
  "use strict";

  const config = window.NumberGameConfig;
  const hintEngine = window.NumberHintEngine;
  const skillEngine = window.NumberSkillEngine;

  const root = document;
  const $ = (selector) => root.querySelector(selector);
  const $$ = (selector) => Array.from(root.querySelectorAll(selector));

  const screens = {
    start: $('[data-screen="start"]'),
    game: $('[data-screen="game"]'),
    result: $('[data-screen="result"]')
  };

  const elements = {
    selectedLabel: $("[data-selected-label]"),
    levelName: $("[data-level-name]"),
    time: $("[data-time]"),
    timerFill: $("[data-timer-fill]"),
    attempts: $("[data-attempts]"),
    hintCount: $("[data-hint-count]"),
    hints: $("[data-hints]"),
    skillCount: $("[data-skill-count]"),
    skills: $("[data-skills]"),
    skillMessage: $("[data-skill-message]"),
    feedback: $("[data-feedback]"),
    feedbackIcon: $("[data-feedback-icon]"),
    feedbackTitle: $("[data-feedback-title]"),
    feedbackCopy: $("[data-feedback-copy]"),
    guessForm: $("[data-guess-form]"),
    guessInput: $("[data-guess-input]"),
    guessButton: $("[data-guess-button]"),
    formMessage: $("[data-form-message]"),
    history: $("[data-history]"),
    historyCount: $("[data-history-count]"),
    resultCard: $("[data-result-card]"),
    resultSymbol: $("[data-result-symbol]"),
    resultEyebrow: $("[data-result-eyebrow]"),
    resultTitle: $("[data-result-title]"),
    resultCopy: $("[data-result-copy]"),
    secret: $("[data-secret]"),
    resultAttempts: $("[data-result-attempts]"),
    resultTime: $("[data-result-time]"),
    resultClosest: $("[data-result-closest]"),
    swapDialog: $("[data-swap-dialog]"),
    swapOptions: $("[data-swap-options]"),
    toast: $("[data-toast]")
  };

  let selectedLevelId = "preschool";
  let timerId = 0;
  let toastTimer = 0;
  let state = null;

  function createState(levelId) {
    const level = config.levels[levelId];
    const secret = 1 + Math.floor(Math.random() * 100);
    return {
      level,
      secret,
      attemptsLeft: level.attempts,
      guesses: [],
      previousDistance: null,
      activeHints: hintEngine.generateHints(level, secret),
      skillIds: skillEngine.pickSkills(level),
      usedSkills: new Set(),
      skillClues: [],
      playing: true,
      startedAt: performance.now(),
      deadline: performance.now() + level.seconds * 1000,
      remainingSeconds: level.seconds
    };
  }

  function showScreen(name) {
    Object.entries(screens).forEach(([key, screen]) => {
      screen.hidden = key !== name;
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function showToast(message) {
    window.clearTimeout(toastTimer);
    elements.toast.textContent = message;
    elements.toast.hidden = false;
    toastTimer = window.setTimeout(() => {
      elements.toast.hidden = true;
    }, 2600);
  }

  function selectLevel(levelId) {
    if (!config.levels[levelId]) return;
    selectedLevelId = levelId;
    $$("[data-level]").forEach((button) => {
      const selected = button.dataset.level === levelId;
      button.classList.toggle("is-selected", selected);
      button.setAttribute("aria-pressed", String(selected));
    });
    elements.selectedLabel.textContent = config.levels[levelId].name;
  }

  function startGame() {
    window.clearInterval(timerId);
    state = createState(selectedLevelId);
    showScreen("game");
    resetPlayUi();
    renderAll();
    timerId = window.setInterval(updateTimer, 100);
    updateTimer();
    window.setTimeout(() => {
      if (!elements.guessInput.disabled) elements.guessInput.focus();
    }, 80);
  }

  function resetPlayUi() {
    elements.guessInput.value = "";
    elements.formMessage.textContent = "";
    elements.formMessage.classList.remove("is-error");
    setFeedback("◎", "Sẵn sàng chưa?", "Nhập một số nguyên từ 1 đến 100.", "idle");
    elements.skillMessage.textContent = state.level.requireSkillBeforeGuess
      ? "Cấp Thần Thánh yêu cầu sử dụng kỹ năng trước khi đoán."
      : "Chọn thời điểm thích hợp để sử dụng kỹ năng.";
  }

  function renderAll() {
    elements.levelName.textContent = state.level.name;
    elements.attempts.textContent = state.attemptsLeft;
    renderHints();
    renderSkills();
    renderHistory();
    updateGuessAvailability();
  }

  function renderHints() {
    const displayHints = state.activeHints.concat(state.skillClues);
    elements.hintCount.textContent = `${displayHints.length} gợi ý`;
    elements.hints.replaceChildren();
    displayHints.forEach((hint, index) => {
      const card = document.createElement("article");
      card.className = "clue-card";
      const badge = document.createElement("span");
      badge.className = "clue-index";
      badge.textContent = String(index + 1).padStart(2, "0");
      const text = document.createElement("p");
      text.textContent = hint.text;
      card.append(badge, text);
      elements.hints.appendChild(card);
    });
  }

  function renderSkills() {
    elements.skillCount.textContent = `${state.skillIds.length} kỹ năng`;
    elements.skills.replaceChildren();
    state.skillIds.forEach((skillId) => {
      const skill = config.skills[skillId];
      const used = state.usedSkills.has(skillId);
      const button = document.createElement("button");
      button.type = "button";
      button.className = `skill-button${used ? " is-used" : ""}`;
      button.dataset.skill = skillId;
      button.disabled = used || !state.playing;
      button.setAttribute("aria-label", `${skill.name}: ${skill.short}`);

      const icon = document.createElement("span");
      icon.className = "skill-icon";
      icon.setAttribute("aria-hidden", "true");
      icon.textContent = skill.icon;
      const name = document.createElement("span");
      name.className = "skill-name";
      name.textContent = skill.name;
      const status = document.createElement("small");
      status.textContent = used ? "Đã dùng" : skill.short;
      button.append(icon, name, status);
      elements.skills.appendChild(button);
    });
  }

  function renderHistory() {
    elements.historyCount.textContent = state.guesses.length;
    elements.history.replaceChildren();
    if (state.guesses.length === 0) {
      const empty = document.createElement("span");
      empty.className = "empty-history";
      empty.textContent = "Chưa có số nào";
      elements.history.appendChild(empty);
      return;
    }
    state.guesses.forEach((guess) => {
      const pill = document.createElement("span");
      pill.className = "history-pill";
      const number = document.createElement("strong");
      number.textContent = guess.value;
      const text = document.createTextNode(`${guess.band.label}${guess.relation ? ` • ${guess.relation}` : ""}`);
      pill.append(number, text);
      elements.history.appendChild(pill);
    });
  }

  function updateGuessAvailability() {
    const mustUseSkill = state.level.requireSkillBeforeGuess && state.usedSkills.size === 0;
    const disabled = !state.playing || mustUseSkill;
    elements.guessInput.disabled = disabled;
    elements.guessButton.disabled = disabled;
    if (mustUseSkill) {
      elements.formMessage.textContent = "Hãy sử dụng kỹ năng được cấp trước khi đoán.";
    } else if (!state.playing) {
      elements.formMessage.textContent = "";
    } else if (!elements.formMessage.classList.contains("is-error")) {
      elements.formMessage.textContent = "";
    }
  }

  function updateTimer() {
    if (!state || !state.playing) return;
    const remainingMs = Math.max(0, state.deadline - performance.now());
    const remainingSeconds = Math.ceil(remainingMs / 1000);
    state.remainingSeconds = remainingSeconds;
    elements.time.textContent = remainingSeconds;
    const ratio = remainingMs / (state.level.seconds * 1000);
    elements.timerFill.style.width = `${Math.max(0, Math.min(100, ratio * 100))}%`;
    elements.timerFill.classList.toggle("is-danger", remainingSeconds <= 10);
    if (remainingMs <= 0) endGame(false, "time");
  }

  function setFeedback(icon, title, copy, tone) {
    elements.feedbackIcon.textContent = icon;
    elements.feedbackTitle.textContent = title;
    elements.feedbackCopy.textContent = copy;
    elements.feedback.dataset.tone = tone;
  }

  function submitGuess(rawValue) {
    if (!state || !state.playing) return;
    if (state.level.requireSkillBeforeGuess && state.usedSkills.size === 0) {
      setFormError("Hãy sử dụng kỹ năng trước lượt đoán.");
      return;
    }

    const value = Number(rawValue);
    if (!Number.isInteger(value) || value < 1 || value > 100) {
      setFormError("Chỉ nhập số nguyên từ 1 đến 100.");
      return;
    }
    if (state.guesses.some((guess) => guess.value === value)) {
      setFormError("Số này đã được đoán. Hãy chọn số khác.");
      return;
    }

    elements.formMessage.textContent = "";
    elements.formMessage.classList.remove("is-error");
    state.attemptsLeft -= 1;
    const distance = Math.abs(value - state.secret);
    const band = config.distanceBand(distance);
    let relation = "";
    if (state.previousDistance !== null) {
      if (distance < state.previousDistance) relation = "Gần hơn";
      else if (distance > state.previousDistance) relation = "Xa hơn";
      else relation = "Không đổi";
    }

    state.guesses.push({ value, distance, band, relation });
    state.previousDistance = distance;
    elements.attempts.textContent = state.attemptsLeft;
    renderHistory();

    if (distance === 0) {
      setFeedback("✓", "Chính xác!", `Bạn đã tìm ra số ${state.secret}.`, "success");
      endGame(true, "correct");
      return;
    }

    const relationText = relation ? ` — ${relation}` : "";
    setFeedback(
      band.icon,
      `${band.label}${relationText}`,
      relation ? `So với lượt đoán ngay trước: ${relation}.` : "Đây là khoảng cách của lượt đoán đầu tiên.",
      band.tone
    );

    if (state.attemptsLeft <= 0) {
      window.setTimeout(() => endGame(false, "attempts"), 450);
      return;
    }

    elements.guessInput.value = "";
    elements.guessInput.focus();
  }

  function setFormError(message) {
    elements.formMessage.textContent = message;
    elements.formMessage.classList.add("is-error");
    showToast(message);
  }

  function useSkill(skillId) {
    if (!state || !state.playing || state.usedSkills.has(skillId)) return;

    if (skillId === "parity") {
      state.skillClues.push(skillEngine.parityClue(state.secret));
      completeSkill(skillId, "Chẵn Hay Lẻ đã cho biết số bí mật là số chẵn hay số lẻ.");
      return;
    }

    if (skillId === "split") {
      const clue = skillEngine.splitClue(state.secret, state.activeHints, state.skillClues);
      state.skillClues.push(clue);
      completeSkill(skillId, "Loại Một Nửa đã loại bỏ một nửa khả năng.");
      return;
    }

    if (skillId === "swap") {
      if (state.activeHints.length === 1) {
        replaceHint(0);
      } else {
        openSwapDialog();
      }
    }
  }

  function completeSkill(skillId, message) {
    state.usedSkills.add(skillId);
    elements.skillMessage.textContent = message;
    renderHints();
    renderSkills();
    updateGuessAvailability();
    if (!elements.guessInput.disabled) elements.guessInput.focus();
    showToast(message);
  }

  function replaceHint(index) {
    const replacement = hintEngine.replacementHint(state.level, state.secret, state.activeHints, index);
    if (!replacement) {
      showToast("Không tìm được gợi ý thay thế phù hợp. Hãy thử lại.");
      return;
    }
    state.activeHints[index] = replacement;
    closeSwapDialog();
    completeSkill("swap", "Đổi Gợi Ý đã tạo một gợi ý mới.");
  }

  function openSwapDialog() {
    elements.swapOptions.replaceChildren();
    state.activeHints.forEach((hint, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "swap-option";
      button.dataset.swapIndex = index;
      button.textContent = hint.text;
      elements.swapOptions.appendChild(button);
    });
    if (typeof elements.swapDialog.showModal === "function") {
      elements.swapDialog.showModal();
    } else {
      elements.swapDialog.setAttribute("open", "");
    }
  }

  function closeSwapDialog() {
    if (typeof elements.swapDialog.close === "function" && elements.swapDialog.open) {
      elements.swapDialog.close();
    } else {
      elements.swapDialog.removeAttribute("open");
    }
  }

  function closestGuess() {
    if (!state.guesses.length) return null;
    return state.guesses.reduce((closest, guess) => (
      guess.distance < closest.distance ? guess : closest
    ));
  }

  function endGame(won, reason) {
    if (!state || !state.playing) return;
    state.playing = false;
    window.clearInterval(timerId);
    closeSwapDialog();

    const usedAttempts = state.level.attempts - state.attemptsLeft;
    const closest = closestGuess();
    elements.resultCard.classList.toggle("is-loss", !won);
    elements.resultSymbol.textContent = won ? "✓" : "✦";
    elements.resultEyebrow.textContent = won ? "CHIẾN THẮNG" : "VÁN CHƠI KẾT THÚC";
    elements.resultTitle.textContent = won ? "Chính xác!" : (reason === "time" ? "Hết giờ!" : "Chưa trúng rồi");
    elements.resultCopy.textContent = won
      ? "Bạn đã tìm ra con số bí mật."
      : (reason === "time" ? "Thời gian đã kết thúc." : "Bạn đã sử dụng hết lượt đoán.");
    elements.secret.textContent = state.secret;
    elements.resultAttempts.textContent = usedAttempts;
    elements.resultTime.textContent = `${state.remainingSeconds} giây`;
    elements.resultClosest.textContent = closest ? closest.value : "Chưa đoán";
    showScreen("result");
  }

  function exitGame() {
    if (state && state.playing) {
      const shouldExit = window.confirm("Thoát ván hiện tại và quay lại chọn cấp độ?");
      if (!shouldExit) return;
    }
    window.clearInterval(timerId);
    closeSwapDialog();
    state = null;
    showScreen("start");
  }

  root.addEventListener("click", (event) => {
    const levelButton = event.target.closest("[data-level]");
    if (levelButton) {
      selectLevel(levelButton.dataset.level);
      return;
    }

    const skillButton = event.target.closest("[data-skill]");
    if (skillButton) {
      useSkill(skillButton.dataset.skill);
      return;
    }

    const swapButton = event.target.closest("[data-swap-index]");
    if (swapButton) {
      replaceHint(Number(swapButton.dataset.swapIndex));
      return;
    }

    const actionButton = event.target.closest("[data-action]");
    if (!actionButton) return;
    const action = actionButton.dataset.action;
    if (action === "start") startGame();
    if (action === "exit") exitGame();
    if (action === "levels") {
      state = null;
      showScreen("start");
    }
    if (action === "replay") startGame();
  });

  elements.guessForm.addEventListener("submit", (event) => {
    event.preventDefault();
    submitGuess(elements.guessInput.value);
  });

  elements.swapDialog.addEventListener("cancel", (event) => {
    event.preventDefault();
    closeSwapDialog();
  });

  selectLevel(selectedLevelId);
})();
