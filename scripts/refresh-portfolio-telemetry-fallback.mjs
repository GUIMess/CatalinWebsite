import fs from "node:fs/promises";
import path from "node:path";

const defaultBotUrl = "https://web-production-a6a95.up.railway.app";
const botUrl = (process.env.VITE_BOT_URL || defaultBotUrl).replace(/\/+$/, "");
const endpoint = `${botUrl}/api/public/portfolio-telemetry`;
const outputPath = path.resolve(process.cwd(), "public", "portfolio-telemetry-fallback.json");

const response = await fetch(endpoint, { headers: { accept: "application/json" } });
if (!response.ok) {
  throw new Error(`Telemetry request failed with status ${response.status}`);
}

const payload = await response.json();
await fs.writeFile(outputPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");

process.stdout.write(`[telemetry] Wrote fallback snapshot to ${outputPath}\n`);
