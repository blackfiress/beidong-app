import initSqlJs from "sql.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, "..", "data", "recitation.db");

let db;

export async function initDb() {
  if (db) return db;
  const SQL = await initSqlJs();
  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }
  db.run("PRAGMA foreign_keys = ON");
  initSchema();
  saveDb();
  return db;
}

function saveDb() {
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(DB_PATH, buffer);
}

function initSchema() {
  db.run(`
    CREATE TABLE IF NOT EXISTS subjects (
      id    INTEGER PRIMARY KEY AUTOINCREMENT,
      name  TEXT NOT NULL UNIQUE,
      emoji TEXT DEFAULT ""
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS texts (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      subject_id INTEGER NOT NULL REFERENCES subjects(id),
      title      TEXT NOT NULL,
      content    TEXT NOT NULL,
      source     TEXT DEFAULT "",
      grade      TEXT DEFAULT "",
      tags       TEXT DEFAULT "",
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS attempts (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      text_id      INTEGER NOT NULL REFERENCES texts(id),
      started_at   TEXT NOT NULL,
      finished_at  TEXT,
      score        INTEGER DEFAULT 0,
      duration_sec INTEGER DEFAULT 0,
      completed    INTEGER DEFAULT 0
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS errors (
      id        INTEGER PRIMARY KEY AUTOINCREMENT,
      attempt_id INTEGER NOT NULL REFERENCES attempts(id),
      position  INTEGER NOT NULL,
      expected  TEXT NOT NULL,
      actual    TEXT NOT NULL,
      type      TEXT NOT NULL DEFAULT "mistake"
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS mistake_summary (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      text_id         INTEGER NOT NULL REFERENCES texts(id),
      character       TEXT NOT NULL,
      expected        TEXT NOT NULL,
      actual_common   TEXT DEFAULT "",
      mistake_count   INTEGER DEFAULT 1,
      last_mistake_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(text_id, character, expected)
    )
  `);
}

export function query(sql, params = []) {
  const stmt = db.prepare(sql);
  if (params.length > 0) stmt.bind(params);
  const results = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject());
  }
  stmt.free();
  return results;
}

export function get(sql, params = []) {
  const rows = query(sql, params);
  return rows.length > 0 ? rows[0] : null;
}

export function run(sql, params = []) {
  db.run(sql, params);
  saveDb();
  return { changes: db.getRowsModified() };
}

export function insert(sql, params = []) {
  db.run(sql, params);
  saveDb();
  return { lastInsertRowid: query("SELECT last_insert_rowid() as id")[0].id };
}

export function getDb() {
  return db;
}
