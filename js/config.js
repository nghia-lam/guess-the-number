(function () {
  "use strict";

  const levels = {
    preschool: {
      id: "preschool",
      name: "Mầm Non",
      attempts: 7,
      seconds: 60,
      hintCount: 1,
      skillCount: 3,
      allowedHintTypes: [1, 2, 3, 6, 7, 8],
      requireSkillBeforeGuess: false
    },
    oracle: {
      id: "oracle",
      name: "Tiên Tri",
      attempts: 5,
      seconds: 50,
      hintCount: 1,
      skillCount: 2,
      allowedHintTypes: [1, 2, 3, 6, 7, 8],
      requireSkillBeforeGuess: false
    },
    divine: {
      id: "divine",
      name: "Thần Thánh",
      attempts: 1,
      seconds: 40,
      hintCount: 3,
      skillCount: 1,
      allowedHintTypes: [1, 2, 3, 4, 5, 6, 7, 8],
      requireSkillBeforeGuess: true
    }
  };

  const distanceBands = [
    { min: 0, max: 0, label: "Chính xác", icon: "✓", tone: "success" },
    { min: 1, max: 3, label: "Kề bên rồi", icon: "⌂", tone: "near" },
    { min: 4, max: 8, label: "Ở Đầu Phố", icon: "▦", tone: "near" },
    { min: 9, max: 15, label: "Ở Ngoại Ô", icon: "◇", tone: "idle" },
    { min: 16, max: 25, label: "Ngoài Khí Quyển", icon: "◌", tone: "far" },
    { min: 26, max: 40, label: "Trên Sao Hỏa", icon: "●", tone: "far" },
    { min: 41, max: Infinity, label: "Ngoài Vũ Trụ", icon: "✦", tone: "far" }
  ];

  const skills = {
    parity: {
      id: "parity",
      name: "Chẵn Hay Lẻ",
      icon: "◉",
      short: "Xem chẵn/lẻ"
    },
    split: {
      id: "split",
      name: "Loại Một Nửa",
      icon: "◐",
      short: "Loại một nửa"
    },
    swap: {
      id: "swap",
      name: "Đổi Gợi Ý",
      icon: "↻",
      short: "Đổi một gợi ý"
    }
  };

  function distanceBand(distance) {
    return distanceBands.find((band) => distance >= band.min && distance <= band.max);
  }

  window.NumberGameConfig = Object.freeze({
    levels,
    distanceBands,
    skills,
    skillIds: Object.keys(skills),
    distanceBand
  });
})();
