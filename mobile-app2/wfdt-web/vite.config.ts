import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { wfdtDevApi } from "./vite-plugin-wfdt-api";

const configDir = path.dirname(fileURLToPath(import.meta.url));

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load `.env` from this package root (not `process.cwd()`, which may be the monorepo root).
  const env = loadEnv(mode, configDir, "");
  // Expose server-only env vars to the Vite dev server process so the
  // middleware API plugin (wfdtDevApi) can read them at runtime.
  const geminiKey = env.GEMINI_API_KEY?.trim();
  const groqKey = env.GROQ_API_KEY?.trim();
  if (env.ANTHROPIC_API_KEY?.trim())
    process.env.ANTHROPIC_API_KEY = env.ANTHROPIC_API_KEY.trim();
  // `.env` values must win over a GEMINI_API_KEY exported in the parent shell.
  if (geminiKey) process.env.GEMINI_API_KEY = geminiKey;
  if (env.GEMINI_MODEL?.trim()) process.env.GEMINI_MODEL = env.GEMINI_MODEL.trim();
  if (env.GEMINI_MAX_RETRIES) process.env.GEMINI_MAX_RETRIES = env.GEMINI_MAX_RETRIES;
  if (groqKey) process.env.GROQ_API_KEY = groqKey;
  if (env.GROQ_MODEL?.trim()) process.env.GROQ_MODEL = env.GROQ_MODEL.trim();
  if (env.MOCK_GENERATION) process.env.MOCK_GENERATION = env.MOCK_GENERATION;
  if (env.FORCE_MOCK) process.env.FORCE_MOCK = env.FORCE_MOCK;
  return {
    plugins: [react(), wfdtDevApi()],
  };
});
