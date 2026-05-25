import { Router } from "express";
import { query, get, run, insert } from "../db.js";
import { compareFullText } from "../compare.js";
const router = Router();

router.post("/", (req, res) => {
  const { text_id, spoken_sentences, duration_sec } = req.body;
  if (!text_id || !spoken_sentences) {
    return res.status(400).json({ error: "text_id and spoken_sentences required" });
  }

  const text = get("SELECT * FROM texts WHERE id = ?", [text_id]);
  if (!text) return res.status(404).json({ error: "Not found" });

  const comparison = compareFullText(text.content, spoken_sentences);
  const now = new Date().toISOString();
  const startedAt = new Date(Date.now() - (duration_sec || 0) * 1000).toISOString();

  const result = insert(
    "INSERT INTO attempts (text_id, started_at, finished_at, score, duration_sec, completed) VALUES (?, ?, ?, ?, ?, 1)",
    [text_id, startedAt, now, comparison.score, duration_sec || 0]
  );
  const attemptId = result.lastInsertRowid;

  for (const e of comparison.errors) {
    if (e.type === "mistake") {
      run(
        "INSERT INTO errors (attempt_id, position, expected, actual, type) VALUES (?, ?, ?, ?, ?)",
        [attemptId, e.position, e.expected, e.actual, e.type]
      );
      // Update or insert into mistake_summary
      const existing = get(
        "SELECT id FROM mistake_summary WHERE text_id=? AND character=? AND expected=?",
        [text_id, e.expected, e.expected]
      );
      if (existing) {
        run(
          "UPDATE mistake_summary SET mistake_count=mistake_count+1, actual_common=?, last_mistake_at=datetime('now') WHERE id=?",
          [e.actual, existing.id]
        );
      } else {
        run(
          "INSERT INTO mistake_summary (text_id, character, expected, actual_common, mistake_count, last_mistake_at) VALUES (?, ?, ?, ?, 1, datetime('now'))",
          [text_id, e.expected, e.expected, e.actual]
        );
      }
    }
  }

  res.status(201).json({ attempt_id: attemptId, ...comparison });
});

router.get("/:text_id", (req, res) => {
  const rows = query(
    "SELECT * FROM attempts WHERE text_id=? AND completed=1 ORDER BY finished_at DESC LIMIT 20",
    [req.params.text_id]
  );
  res.json(rows);
});

export default router;
