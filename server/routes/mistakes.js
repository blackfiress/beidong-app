import { Router } from "express";
import { query, get, run, insert } from "../db.js";
const router = Router();

router.get("/summary", (req, res) => {
  const { text_id } = req.query;
  let rows;
  if (text_id) {
    rows = query(
      "SELECT ms.*, t.title as text_title FROM mistake_summary ms JOIN texts t ON ms.text_id=t.id WHERE ms.text_id=? ORDER BY ms.mistake_count DESC LIMIT 20",
      [text_id]
    );
  } else {
    rows = query(
      "SELECT ms.*, t.title as text_title FROM mistake_summary ms JOIN texts t ON ms.text_id=t.id ORDER BY ms.mistake_count DESC LIMIT 50"
    );
  }
  res.json(rows);
});

router.get("/rankings", (req, res) => {
  const rows = query(
    "SELECT ms.character,ms.expected,ms.actual_common,ms.mistake_count,t.title as text_title,t.id as text_id FROM mistake_summary ms JOIN texts t ON ms.text_id=t.id ORDER BY ms.mistake_count DESC LIMIT 30"
  );
  res.json(rows);
});

router.get("/stats", (req, res) => {
  const stats = get(
    "SELECT COUNT(*) as total_attempts, COALESCE(AVG(score),0) as avg_score, (SELECT COUNT(*) FROM texts) as total_texts, (SELECT COUNT(*) FROM mistake_summary) as total_mistake_types FROM attempts WHERE completed=1"
  );
  const trend = query(
    "SELECT date(finished_at) as day, ROUND(AVG(score)) as avg_score, COUNT(*) as count FROM attempts WHERE completed=1 AND finished_at>=datetime('now','-7 days') GROUP BY date(finished_at) ORDER BY day"
  );
  const weakTexts = query(
    "SELECT t.id,t.title,ROUND(AVG(a.score)) as avg_score,COUNT(*) as attempt_count FROM attempts a JOIN texts t ON a.text_id=t.id WHERE a.completed=1 GROUP BY a.text_id ORDER BY avg_score ASC LIMIT 5"
  );
  res.json({ ...stats, trend, weakTexts });
});

router.delete("/", (req, res) => {
  run("DELETE FROM mistake_summary");
  res.json({ ok: true });
});

export default router;
