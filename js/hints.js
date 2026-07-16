(function () {
  "use strict";

  const allNumbers = Array.from({ length: 100 }, (_, index) => index + 1);
  const roundMarks = [10, 20, 30, 40, 50, 60, 70, 80, 90];

  function randomItem(items) {
    return items[Math.floor(Math.random() * items.length)];
  }

  function shuffle(items) {
    const result = items.slice();
    for (let index = result.length - 1; index > 0; index -= 1) {
      const target = Math.floor(Math.random() * (index + 1));
      [result[index], result[target]] = [result[target], result[index]];
    }
    return result;
  }

  function digitSum(number) {
    return String(number).split("").reduce((sum, digit) => sum + Number(digit), 0);
  }

  function hasRepeatedTwoDigits(number) {
    const value = String(number);
    return value.length === 2 && value[0] === value[1];
  }

  function candidateSignature(candidates) {
    return candidates.join(",");
  }

  function finalizeHint(type, text, predicate, meta) {
    const candidates = allNumbers.filter(predicate);
    return {
      type,
      text,
      predicate,
      candidates,
      signature: candidateSignature(candidates),
      meta: meta || {}
    };
  }

  function createHint(type, secret, forcedParameter) {
    if (type === 1) {
      const upper = secret >= 60;
      return finalizeHint(
        type,
        upper ? "Số bí mật nằm trong khoảng 60–100." : "Số bí mật nằm trong khoảng 1–59.",
        upper ? (number) => number >= 60 : (number) => number <= 59
      );
    }

    if (type === 2) {
      const mark = forcedParameter || randomItem(roundMarks);
      const upper = secret > mark;
      return finalizeHint(
        type,
        upper ? `Số bí mật lớn hơn ${mark}.` : `Số bí mật không lớn hơn ${mark}.`,
        upper ? (number) => number > mark : (number) => number <= mark,
        { mark }
      );
    }

    if (type === 3) {
      const mark = forcedParameter || randomItem(roundMarks);
      const nearby = Math.abs(secret - mark) <= 10;
      return finalizeHint(
        type,
        nearby
          ? `Số bí mật cách số ${mark} không quá 10 đơn vị.`
          : `Số bí mật cách số ${mark} hơn 10 đơn vị.`,
        nearby
          ? (number) => Math.abs(number - mark) <= 10
          : (number) => Math.abs(number - mark) > 10,
        { mark }
      );
    }

    if (type === 4) {
      const containsZero = String(secret).includes("0");
      return finalizeHint(
        type,
        containsZero ? "Số bí mật có chữ số 0." : "Số bí mật không có chữ số 0.",
        containsZero
          ? (number) => String(number).includes("0")
          : (number) => !String(number).includes("0")
      );
    }

    if (type === 5) {
      const repeated = hasRepeatedTwoDigits(secret);
      return finalizeHint(
        type,
        repeated
          ? "Số bí mật có hai chữ số giống nhau."
          : "Số bí mật không có hai chữ số giống nhau.",
        repeated ? hasRepeatedTwoDigits : (number) => !hasRepeatedTwoDigits(number)
      );
    }

    if (type === 6) {
      const greater = digitSum(secret) > 9;
      return finalizeHint(
        type,
        greater
          ? "Cộng các chữ số lại, kết quả lớn hơn 9."
          : "Cộng các chữ số lại, kết quả không quá 9.",
        greater ? (number) => digitSum(number) > 9 : (number) => digitSum(number) <= 9
      );
    }

    if (type === 7) {
      const firstHalf = secret % 10 <= 4;
      return finalizeHint(
        type,
        firstHalf
          ? "Chữ số cuối của số bí mật nằm từ 0 đến 4."
          : "Chữ số cuối của số bí mật nằm từ 5 đến 9.",
        firstHalf ? (number) => number % 10 <= 4 : (number) => number % 10 >= 5
      );
    }

    if (type === 8) {
      const addend = forcedParameter || randomItem(roundMarks);
      const greater = secret + addend > 100;
      return finalizeHint(
        type,
        greater
          ? `Số bí mật cộng ${addend} sẽ lớn hơn 100.`
          : `Số bí mật cộng ${addend} sẽ không quá 100.`,
        greater
          ? (number) => number + addend > 100
          : (number) => number + addend <= 100,
        { addend }
      );
    }

    throw new Error(`Loại gợi ý không hợp lệ: ${type}`);
  }

  function generateHints(level, secret) {
    const maxAttempts = 200;
    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      const types = shuffle(level.allowedHintTypes).slice(0, level.hintCount);
      const hints = types.map((type) => createHint(type, secret));
      const uniqueSignatures = new Set(hints.map((hint) => hint.signature));
      const uniqueTexts = new Set(hints.map((hint) => hint.text));
      if (uniqueSignatures.size === hints.length && uniqueTexts.size === hints.length) {
        return hints;
      }
    }
    throw new Error("Không thể tạo bộ gợi ý hợp lệ.");
  }

  function replacementHint(level, secret, currentHints, replaceIndex) {
    const retained = currentHints.filter((_, index) => index !== replaceIndex);
    const oldHint = currentHints[replaceIndex];
    const retainedSignatures = new Set(retained.map((hint) => hint.signature));
    const retainedTexts = new Set(retained.map((hint) => hint.text));
    const preferredTypes = shuffle(level.allowedHintTypes.filter((type) => type !== oldHint.type));
    const fallbackTypes = shuffle(level.allowedHintTypes);
    const types = preferredTypes.concat(fallbackTypes);

    for (let attempt = 0; attempt < 240; attempt += 1) {
      const type = types[attempt % types.length];
      const hint = createHint(type, secret);
      if (
        hint.text !== oldHint.text &&
        hint.signature !== oldHint.signature &&
        !retainedSignatures.has(hint.signature) &&
        !retainedTexts.has(hint.text)
      ) {
        return hint;
      }
    }
    return null;
  }

  function intersectCandidates(hints) {
    return allNumbers.filter((number) => hints.every((hint) => hint.predicate(number)));
  }

  window.NumberHintEngine = Object.freeze({
    allNumbers,
    createHint,
    generateHints,
    replacementHint,
    intersectCandidates,
    shuffle
  });
})();
