import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Fills `process.env` from `wfdt-web/.env` only for keys that are missing or empty.
 * Vite's `loadEnv` runs in the config phase; this is a fallback so `/api/*` middleware
 * always sees keys when the file exists. Does not override non-empty env (e.g. Vercel).
 */
function parseDotEnvFile(contents: string): Record<string, string> {
  const out: Record<string, string> = {};
  const lines = contents.replace(/^\uFEFF/, "").split(/\r?\n/);
  for (const line of lines) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq <= 0) continue;
    const key = t.slice(0, eq).trim();
    if (!key) continue;
    let val = t.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    out[key] = val;
  }
  return out;
}

let didLoad = false;

/** These must match `wfdt-web/.env`, not a stale value exported in the parent shell. */
const FILE_WINS_KEYS = new Set([
  "ANTHROPIC_API_KEY",
  "ANTHROPIC_MODEL",
  "GEMINI_API_KEY",
  "GROQ_API_KEY",
  "GEMINI_MODEL",
  "GEMINI_MAX_RETRIES",
  "GROQ_MODEL",
  "MOCK_GENERATION",
  "FORCE_MOCK",
]);

export function loadRootEnvOnce(): void {
  if (didLoad) return;
  didLoad = true;

  const libDir = path.dirname(fileURLToPath(import.meta.url));
  const root = path.dirname(libDir);

  let merged: Record<string, string> = {};
  for (const name of [".env", ".env.local"]) {
    const envPath = path.join(root, name);
    if (!fs.existsSync(envPath)) continue;
    try {
      const parsed = parseDotEnvFile(fs.readFileSync(envPath, "utf8"));
      merged = { ...merged, ...parsed };
    } catch {
      // ignore
    }
  }
  if (Object.keys(merged).length === 0) return;

  try {
    for (const [key, value] of Object.entries(merged)) {
      const v = value.trim();
      if (!v) continue;
      if (FILE_WINS_KEYS.has(key) || !process.env[key]?.trim()) {
        process.env[key] = v;
      }
    }
  } catch {
    // ignore
  }
}
