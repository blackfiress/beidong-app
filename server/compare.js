export function compareSentence(expected, actual) {
  const norm = s => s.replace(/[^\w\u4e00-\u9fff]/g, "").toLowerCase();
  const e = norm(expected);
  const a = norm(actual);
  if (!e) return { matched: [], errors: [], score: 100 };

  const matched = [];
  const errors = [];
  let correct = 0;

  for (let i = 0; i < e.length; i++) {
    const ac = i < a.length ? a[i] : null;
    if (ac === e[i]) {
      matched.push({ index: i, expected: e[i], actual: e[i], correct: true });
      correct++;
    } else if (ac !== null) {
      matched.push({ index: i, expected: e[i], actual: ac, correct: false });
      errors.push({ position: i, expected: e[i], actual: ac, type: "mistake" });
    } else {
      matched.push({ index: i, expected: e[i], actual: "", correct: false });
      errors.push({ position: i, expected: e[i], actual: "", type: "skip" });
    }
  }

  for (let i = e.length; i < a.length; i++) {
    matched.push({ index: i, expected: "", actual: a[i], correct: false });
    errors.push({ position: i, expected: "", actual: a[i], type: "extra" });
  }

  return {
    matched,
    errors,
    score: e.length > 0 ? Math.round((correct / e.length) * 100) : 100
  };
}

export function compareFullText(expectedText, spokenSentences) {
  const sentences = expectedText.split("|").map(s => s.trim()).filter(s => s);
  const allErrors = [];
  let totalChars = 0;
  let totalCorrect = 0;
  let globalOffset = 0;

  const results = sentences.map((sentence, idx) => {
    const spoken = spokenSentences[idx] || "";
    const result = compareSentence(sentence, spoken);
    const adjustedErrors = result.errors.map(e => ({
      ...e,
      position: e.position + globalOffset
    }));
    allErrors.push(...adjustedErrors);
    totalChars += sentence.replace(/[^\w\u4e00-\u9fff]/g, "").length;
    totalCorrect += result.matched.filter(m => m.correct).length;
    globalOffset += sentence.length + 1;
    return { sentenceIndex: idx, ...result };
  });

  return {
    results,
    errors: allErrors,
    score: totalChars > 0 ? Math.round((totalCorrect / totalChars) * 100) : 100
  };
}
