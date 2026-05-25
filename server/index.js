import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { initDb } from "./db.js";
import textsRouter from "./routes/texts.js";
import attemptsRouter from "./routes/attempts.js";
import mistakesRouter from "./routes/mistakes.js";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3457;
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use("/api/texts", textsRouter);
app.use("/api/attempts", attemptsRouter);
app.use("/api/mistakes", mistakesRouter);
const distPath = path.join(__dirname, "..", "client", "dist");
const publicPath = path.join(__dirname, "..", "client", "public");
const staticPath = fs.existsSync(distPath) ? distPath : publicPath;
console.log("Serving from: " + staticPath);
if (fs.existsSync(staticPath)) {
  app.use(express.static(staticPath));
  app.get("*", (req, res) => {
    if (!req.path.startsWith("/api")) res.sendFile(path.join(staticPath, "index.html"));
  });
}
initDb().then(() => {
  app.listen(PORT, () => console.log("Server on http://localhost:" + PORT));
}).catch(err => console.error("DB init failed:", err));
