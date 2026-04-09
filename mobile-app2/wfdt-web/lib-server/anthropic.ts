const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_VERSION = "2023-06-01";

import { jsonrepair } from "jsonrepair";

function requireEnv(name: string): string {
  const v = process.env[name]?.trim();
  if (!v) throw new Error(`Missing ${name}`);
  return v;
}

export async function callClaude(
  prompt: string,
  maxTokens: number
): Promise<string> {
  const key = requireEnv("ANTHROPIC_API_KEY");
  const model = (process.env.ANTHROPIC_MODEL || "claude-sonnet-4-20250514").trim();

  const res = await fetch(ANTHROPIC_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": key,
      "anthropic-version": ANTHROPIC_VERSION,
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Anthropic API error ${res.status}: ${errText}`);
  }

  const data = (await res.json()) as {
    content?: Array<{ type?: string; text?: string }>;
  };
  const text = (data.content ?? [])
    .map((b) => (b.type === "text" ? b.text ?? "" : ""))
    .join("");
  return text.trim();
}

export function extractJsonArray(text: string): unknown {
  const trimmed = text.trim();
  const unfenced = trimmed
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  // Fast-path: already valid JSON.
  try {
    return JSON.parse(unfenced);
  } catch {
    // Fall through to best-effort extraction.
  }

  const firstArray = unfenced.indexOf("[");
  const lastArray = unfenced.lastIndexOf("]");
  if (firstArray !== -1 && lastArray !== -1 && lastArray > firstArray) {
    const slice = unfenced.slice(firstArray, lastArray + 1);
    try {
      return JSON.parse(slice);
    } catch (e) {
      try {
        return JSON.parse(jsonrepair(slice));
      } catch {
        const msg = e instanceof Error ? e.message : "Invalid JSON";
        throw new Error(`${msg}. Received: ${slice.slice(0, 220)}`);
      }
    }
  }

  // If an array starts but never closes (truncated output), try repairing from the first '['.
  if (firstArray !== -1 && (lastArray === -1 || lastArray <= firstArray)) {
    const slice = unfenced.slice(firstArray);
    try {
      const repaired = jsonrepair(slice);
      return JSON.parse(repaired);
    } catch {
      // continue
    }
  }

  // As a final attempt, extract an object.
  const firstObj = unfenced.indexOf("{");
  const lastObj = unfenced.lastIndexOf("}");
  if (firstObj !== -1 && lastObj !== -1 && lastObj > firstObj) {
    const slice = unfenced.slice(firstObj, lastObj + 1);
    try {
      return JSON.parse(slice);
    } catch (e) {
      try {
        return JSON.parse(jsonrepair(slice));
      } catch {
        const msg = e instanceof Error ? e.message : "Invalid JSON";
        throw new Error(`${msg}. Received: ${slice.slice(0, 220)}`);
      }
    }
  }

  // Last resort: attempt repair on the whole response.
  try {
    return JSON.parse(jsonrepair(unfenced));
  } catch {
    throw new Error(`Model did not return JSON. Received: ${unfenced.slice(0, 220)}`);
  }
}

export function extractJsonObject(text: string): unknown {
  const parsed = extractJsonArray(text);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Expected a JSON object");
  }
  return parsed;
}
