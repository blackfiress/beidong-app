import { spawn } from "child_process";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serverPath = path.join(__dirname, "index.js");

const child = spawn("node", [serverPath], {
  stdio: "inherit",
  detached: false,
});

process.on("SIGINT", () => { child.kill(); process.exit(); });
process.on("SIGTERM", () => { child.kill(); process.exit(); });

// Keep alive with a simple HTTP keepalive
setInterval(() => {}, 60000);
