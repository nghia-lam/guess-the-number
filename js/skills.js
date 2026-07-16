(function () {
  "use strict";

  const config = window.NumberGameConfig;
  const hints = window.NumberHintEngine;

  function pickSkills(level) {
    return hints.shuffle(config.skillIds).slice(0, level.skillCount);
  }

  function parityClue(secret) {
    const even = secret % 2 === 0;
    return {
      id: "skill-parity",
      text: even ? "Chẵn Hay Lẻ: số bí mật là số chẵn." : "Chẵn Hay Lẻ: số bí mật là số lẻ.",
      predicate: even ? (number) => number % 2 === 0 : (number) => number % 2 !== 0
    };
  }

  function splitClue(secret, activeHints, skillClues) {
    const combined = activeHints.concat(skillClues || []);
    const candidates = hints.intersectCandidates(combined);
    const pool = candidates.includes(secret) ? candidates : hints.allNumbers.slice();
    const midpoint = Math.ceil(pool.length / 2);
    const lower = pool.slice(0, midpoint);
    const upper = pool.slice(midpoint);
    const chosen = lower.includes(secret) || upper.length === 0 ? lower : upper;
    const allowed = new Set(chosen);
    const min = chosen[0];
    const max = chosen[chosen.length - 1];
    return {
      id: "skill-split",
      text: `Loại Một Nửa: hãy tập trung vào khoảng ${min}–${max}.`,
      predicate: (number) => allowed.has(number)
    };
  }

  window.NumberSkillEngine = Object.freeze({
    pickSkills,
    parityClue,
    splitClue
  });
})();
