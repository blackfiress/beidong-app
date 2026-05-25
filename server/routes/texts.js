import { Router } from "express";
import { query, get, run, insert } from "../db.js";
const router = Router();

router.get("/", (req, res) => {
  const { subject } = req.query;
  let sql = `
    SELECT t.*, s.name as subject_name, s.emoji as subject_emoji,
      (SELECT COALESCE(AVG(score), 0) FROM attempts WHERE text_id = t.id AND completed = 1) as avg_score,
      (SELECT COUNT(*) FROM attempts WHERE text_id = t.id AND completed = 1) as attempt_count
    FROM texts t JOIN subjects s ON t.subject_id = s.id
  `;
  const params = [];
  if (subject) {
    sql += " WHERE s.name = ?";
    params.push(subject);
  }
  sql += " ORDER BY t.created_at DESC";
  res.json(query(sql, params));
});

router.get("/:id", (req, res) => {
  const text = get(`
    SELECT t.*, s.name as subject_name, s.emoji as subject_emoji
    FROM texts t JOIN subjects s ON t.subject_id = s.id
    WHERE t.id = ?
  `, [req.params.id]);
  if (!text) return res.status(404).json({ error: "Not found" });
  text.sentences = text.content.split("|").filter(s => s.trim());
  res.json(text);
});

router.post("/", (req, res) => {
  const { subject_id, title, content, source, grade, tags } = req.body;
  if (!subject_id || !title || !content) {
    return res.status(400).json({ error: "subject_id, title, content required" });
  }
  const result = insert(
    "INSERT INTO texts (subject_id, title, content, source, grade, tags) VALUES (?, ?, ?, ?, ?, ?)",
    [subject_id, title, content, source || "", grade || "", tags || ""]
  );
  res.status(201).json({ id: result.lastInsertRowid });
});

router.put("/:id", (req, res) => {
  const { title, content, source, grade, tags } = req.body;
  run("UPDATE texts SET title=?, content=?, source=?, grade=?, tags=? WHERE id=?",
    [title, content, source || "", grade || "", tags || "", req.params.id]);
  res.json({ ok: true });
});

router.delete("/:id", (req, res) => {
  run("DELETE FROM texts WHERE id=?", [req.params.id]);
  res.json({ ok: true });
});

export default router;
