#!/usr/bin/env node
/**
 * Verifies GEMINI_API_KEY against Google (Generative Language API) without running the app.
 * Usage: from wfdt-web folder, `npm run check-gemini`
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const out = {};
  const text = fs.readFileSync(filePath, "utf8").replace(/^\uFEFF/, "");
  for (const line of text.split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq <= 0) continue;
    const k = t.slice(0, eq).trim();
    let v = t.slice(eq + 1).trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    out[k] = v;
  }
  return out;
}

const fromEnv = { ...parseEnvFile(path.join(root, ".env")), ...parseEnvFile(path.join(root, ".env.local")) };
const key = (fromEnv.GEMINI_API_KEY ?? process.env.GEMINI_API_KEY ?? "")
  .replace(/[\u200B-\u200D\uFEFF]/g, "")
  .trim();

if (!key) {
  console.error("No GEMINI_API_KEY in wfdt-web/.env (or .env.local) or process.env.");
  process.exit(1);
}

console.log("Key length:", key.length, "| prefix:", key.slice(0, 4) + "…");

const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(key)}`;
const res = await fetch(url);
const text = await res.text();

if (!res.ok) {
  console.error("Google returned", res.status);
  console.error(text.slice(0, 800));
  process.exit(1);
}

console.log("OK — Google accepted this API key (Generative Language API).");
console.log("First model id in list:", (() => {
  try {
    const j = JSON.parse(text);
    const m = j.models?.[0]?.name;
    return m ?? "(none)";
  } catch {
    return "(parse error)";
  }
})());
