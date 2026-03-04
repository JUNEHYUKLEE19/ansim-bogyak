import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";

const db = new Database("medication.db");

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS medications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    time TEXT NOT NULL,
    times_per_day TEXT NOT NULL,
    with_meal TEXT NOT NULL,
    start_date TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS dose_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    medication_id INTEGER NOT NULL,
    scheduled_at TEXT NOT NULL,
    taken_at TEXT,
    status TEXT DEFAULT 'pending',
    FOREIGN KEY (medication_id) REFERENCES medications(id)
  );

  CREATE TABLE IF NOT EXISTS caregiver (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    phone TEXT,
    delay_minutes INTEGER DEFAULT 30,
    enabled INTEGER DEFAULT 0
  );
`);

// Seed caregiver if not exists
const caregiverCount = db.prepare("SELECT COUNT(*) as count FROM caregiver").get() as { count: number };
if (caregiverCount.count === 0) {
  db.prepare("INSERT INTO caregiver (name, phone, delay_minutes, enabled) VALUES (?, ?, ?, ?)").run("", "", 30, 0);
}

async function startServer() {
  const app = express();
  app.use(express.json());
  const PORT = 3000;

  // API Routes
  app.get("/api/medications", (req, res) => {
    const rows = db.prepare("SELECT * FROM medications").all();
    res.json(rows);
  });

  app.post("/api/medications", (req, res) => {
    const { name, time, times_per_day, with_meal, start_date } = req.body;
    const info = db.prepare("INSERT INTO medications (name, time, times_per_day, with_meal, start_date) VALUES (?, ?, ?, ?, ?)")
      .run(name, time, times_per_day, with_meal, start_date);
    res.json({ id: info.lastInsertRowid });
  });

  app.delete("/api/medications/:id", (req, res) => {
    db.prepare("DELETE FROM medications WHERE id = ?").run(req.params.id);
    db.prepare("DELETE FROM dose_logs WHERE medication_id = ?").run(req.params.id);
    res.json({ success: true });
  });

  app.get("/api/dose-logs/today", (req, res) => {
    const today = new Date().toISOString().split('T')[0];
    const rows = db.prepare(`
      SELECT dl.*, m.name, m.time as scheduled_time
      FROM dose_logs dl
      JOIN medications m ON dl.medication_id = m.id
      WHERE dl.scheduled_at LIKE ?
    `).all(`${today}%`);
    res.json(rows);
  });

  app.post("/api/dose-logs/take", (req, res) => {
    const { medication_id, scheduled_at } = req.body;
    const taken_at = new Date().toISOString();
    
    // Check if log exists for this schedule
    const existing = db.prepare("SELECT id FROM dose_logs WHERE medication_id = ? AND scheduled_at = ?")
      .get(medication_id, scheduled_at) as { id: number } | undefined;

    if (existing) {
      db.prepare("UPDATE dose_logs SET taken_at = ?, status = 'taken' WHERE id = ?")
        .run(taken_at, existing.id);
      res.json({ id: existing.id, status: 'taken' });
    } else {
      const info = db.prepare("INSERT INTO dose_logs (medication_id, scheduled_at, taken_at, status) VALUES (?, ?, ?, 'taken')")
        .run(medication_id, scheduled_at, taken_at);
      res.json({ id: info.lastInsertRowid, status: 'taken' });
    }
  });

  app.post("/api/dose-logs/undo", (req, res) => {
    const { log_id } = req.body;
    db.prepare("UPDATE dose_logs SET taken_at = NULL, status = 'pending' WHERE id = ?")
      .run(log_id);
    res.json({ success: true });
  });

  app.get("/api/caregiver", (req, res) => {
    const row = db.prepare("SELECT * FROM caregiver LIMIT 1").get();
    res.json(row);
  });

  app.post("/api/caregiver", (req, res) => {
    const { name, phone, delay_minutes, enabled } = req.body;
    db.prepare("UPDATE caregiver SET name = ?, phone = ?, delay_minutes = ?, enabled = ? WHERE id = 1")
      .run(name, phone, delay_minutes, enabled ? 1 : 0);
    res.json({ success: true });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
