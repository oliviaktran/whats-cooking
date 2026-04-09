import { loadRootEnvOnce } from "./loadRootEnv";
import { callClaude } from "./anthropic";

loadRootEnvOnce();

type LlmProvider = "claude" | "gemini" | "groq" | "mock";

function requireEnv(name: string): string {
  const v = process.env[name]?.trim();
  if (!v) throw new Error(`Missing ${name}`);
  return v;
}

/** Strip whitespace / invisible chars that break Google’s key validation. */
function sanitizeGeminiApiKey(raw: string): string {
  return raw
    .replace(/^\uFEFF/, "")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/[\r\n\t]/g, "")
    .trim();
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** HTTP 503/429 and overloaded-model JSON statuses — safe to retry with backoff. */
function shouldRetryGemini(httpStatus: number, body: string): boolean {
  if (httpStatus === 503 || httpStatus === 429 || httpStatus === 500) return true;
  try {
    const j = JSON.parse(body) as {
      error?: { status?: string; code?: number; message?: string };
    };
    const st = j.error?.status ?? "";
    if (st === "UNAVAILABLE" || st === "RESOURCE_EXHAUSTED") return true;
    const code = j.error?.code;
    if (code === 503 || code === 429) return true;
    const msg = (j.error?.message ?? "").toLowerCase();
    if (msg.includes("high demand") || msg.includes("try again later"))
      return true;
    if (msg.includes("quota") || msg.includes("rate limit")) return true;
  } catch {
    /* ignore */
  }
  return false;
}

function geminiErrorHint(status: number, errText: string): string {
  try {
    const j = JSON.parse(errText) as {
      error?: { message?: string; status?: string };
    };
    if (
      j.error?.status === "INVALID_ARGUMENT" &&
      /API key|API_KEY_INVALID/i.test(j.error?.message ?? "")
    ) {
      return " The app is sending your key, but Google rejected it. Fix: (1) Create a new key at https://aistudio.google.com/apikey (2) In Google Cloud Console → APIs & Services → Library, enable “Generative Language API” for that key’s project. (3) Credentials → your key → Application restrictions = “None” for server/local use (HTTP referrers block Node/fetch). (4) Run `npm run check-gemini` in wfdt-web to verify the key outside the app.";
    }
    if (
      status === 503 ||
      j.error?.status === "UNAVAILABLE" ||
      /high demand|try again later/i.test(j.error?.message ?? "")
    ) {
      return " Google’s model was overloaded; the app retried automatically. Wait a minute and try again, or set GEMINI_MODEL to another flash model (e.g. gemini-2.0-flash) in wfdt-web/.env.";
    }
  } catch {
    /* ignore */
  }
  return "";
}

function pickProvider(): LlmProvider {
  if (process.env.FORCE_MOCK === "1") return "mock";
  if (process.env.ANTHROPIC_API_KEY?.trim()) return "claude";
  if (process.env.GEMINI_API_KEY?.trim()) return "gemini";
  if (process.env.GROQ_API_KEY?.trim()) return "groq";
  if (process.env.MOCK_GENERATION === "1") return "mock";
  return "mock";
}

function pickOne(list: string[], fallback: string) {
  const items = list
    .map((s) => s.trim())
    .filter((s) => s && s.toLowerCase() !== "any");
  return items[0] ?? fallback;
}

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

function sampleRecipesFromPrompt(prompt: string): unknown[] {
  const servings = Number(prompt.match(/- Servings:\s*(\d+)/)?.[1] ?? 2) || 2;
  const calories =
    Number(prompt.match(/- Target calories:\s*(\d+)/)?.[1] ?? 500) || 500;
  const cuisineRaw = (prompt.match(/- Cuisine:\s*(.+)\n/)?.[1] ?? "any").trim();
  const cuisine = cuisineRaw.toLowerCase();

  const proteinLine = prompt.match(/- Protein:\s*(.+)\n/)?.[1] ?? "any";
  const carbLine = prompt.match(/- Carbs:\s*(.+)\n/)?.[1] ?? "any";
  const vegLine = prompt.match(/- Vegetables:\s*(.+)\n/)?.[1] ?? "any";

  const proteins = proteinLine.split(",").map((s) => s.trim()).filter(Boolean);
  const carbs = carbLine.split(",").map((s) => s.trim()).filter(Boolean);
  const vegs = vegLine.split(",").map((s) => s.trim()).filter(Boolean);

  const protein = pickOne(proteins, "Chicken breast");
  const carb = pickOne(carbs, "Basmati rice");
  const veg = pickOne(vegs, "Broccoli");

  const baseTitle = cuisine !== "any" && cuisine ? `${cuisine} ` : "";
  const r1Title = `${baseTitle}${protein} with ${carb} & ${veg}`.replace(
    /\s+/g,
    " "
  );
  const r2Title = `${baseTitle}Sheet-Pan ${protein} and ${veg} with ${carb}`;
  const r3Title = `${baseTitle}${protein} Bowl with ${carb}, ${veg} and Sauce`;

  const mk = (
    title: string,
    emoji: string,
    isTopPick: boolean,
    idSuffix: string,
    steps: string[]
  ) => ({
    id: slugify(`${title}-${idSuffix}`),
    emoji,
    title,
    description: `A quick ${servings}-serving dinner built around ${protein}, ${carb}, and ${veg}.`,
    cookTime: "25 mins",
    difficulty: "Easy",
    calories,
    macros: { protein: 35, carbs: 45, fat: 20 },
    ingredients: [
      { id: "1", quantity: "300g", name: protein },
      { id: "2", quantity: "200g", name: carb },
      { id: "3", quantity: "200g", name: veg },
      { id: "4", quantity: "2 tbsp", name: "olive oil" },
      { id: "5", quantity: "1 tsp", name: "salt" },
      { id: "6", quantity: "1 tsp", name: "black pepper" },
      { id: "7", quantity: "2 cloves", name: "garlic" },
      { id: "8", quantity: "1", name: "lemon" }
    ],
    steps,
    isTopPick
  });

  const stepsOnePan = [
    `Pat ${protein} dry, season with salt and pepper, and cube ${veg} for even cooking.`,
    `Cook ${carb} according to package directions until tender; keep warm.`,
    `Sear ${protein} in olive oil until golden and cooked through, then rest briefly.`,
    `In the same pan, soften garlic, add ${veg}, and cook until tender-crisp.`,
    `Finish with lemon juice, toss ${carb} with the pan juices, and serve together.`,
  ];
  const stepsSheet = [
    `Heat the oven to 200°C. Toss ${veg} and chunks of ${carb} with oil, salt, and pepper on a tray.`,
    `Roast 12–15 minutes, then push to one side; add ${protein} to the tray.`,
    `Roast until ${protein} is cooked and ${veg} has edges that colour nicely.`,
    `Rest ${protein} 3 minutes, squeeze lemon over the tray, and scrape up any crispy bits.`,
    `Plate ${protein} over ${carb} and ${veg}, drizzle pan juices on top.`,
  ];
  const stepsBowl = [
    `Cook ${carb} and ${veg} (steam, roast, or sauté) until ready for a grain bowl.`,
    `Season and pan-sear or grill ${protein} until browned and cooked through; slice if needed.`,
    `Whisk olive oil, lemon, garlic, salt, and pepper for a simple dressing.`,
    `Layer warm ${carb} in bowls, add ${veg} and sliced ${protein}.`,
    `Dress the bowl, toss gently, and serve hot.`,
  ];

  return [
    mk(r1Title, "🍽️", true, "1", stepsOnePan),
    mk(r2Title, "🥘", false, "2", stepsSheet),
    mk(r3Title, "🥗", false, "3", stepsBowl),
  ];
}

async function callGemini(prompt: string, maxTokens: number): Promise<string> {
  const key = sanitizeGeminiApiKey(requireEnv("GEMINI_API_KEY"));
  if (!key.startsWith("AIza") || key.length < 30) {
    throw new Error(
      "GEMINI_API_KEY does not look like a Google API key (expected to start with “AIza”). Re-copy it from https://aistudio.google.com/apikey",
    );
  }
  const model = (process.env.GEMINI_MODEL || "gemini-2.5-flash").trim();
  const base = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    model,
  )}:generateContent`;
  const url = `${base}?key=${encodeURIComponent(key)}`;

  const rawAttempts = Number(process.env.GEMINI_MAX_RETRIES ?? "5");
  const maxAttempts = Number.isFinite(rawAttempts)
    ? Math.min(12, Math.max(1, Math.floor(rawAttempts)))
    : 5;

  const payload = JSON.stringify({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: {
      maxOutputTokens: maxTokens,
      temperature: 0.6,
      responseMimeType: "application/json",
    },
  });

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    if (attempt > 0) {
      const backoffMs = Math.min(25_000, 2000 * 2 ** (attempt - 1));
      await sleep(backoffMs);
    }

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: payload,
    });

    const errText = await res.text();

    if (res.ok) {
      let data: {
        candidates?: Array<{
          content?: { parts?: Array<{ text?: string }> };
        }>;
      };
      try {
        data = JSON.parse(errText) as typeof data;
      } catch {
        throw new Error(
          `Gemini returned non-JSON. First 200 chars: ${errText.slice(0, 200)}`,
        );
      }
      const text =
        data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ??
        "";
      return text.trim();
    }

    const canRetry =
      shouldRetryGemini(res.status, errText) && attempt < maxAttempts - 1;
    if (canRetry) continue;

    const hint = geminiErrorHint(res.status, errText);
    throw new Error(`Gemini API error ${res.status}: ${errText}${hint}`);
  }

  throw new Error(
    `Gemini failed after ${maxAttempts} attempts (unexpected loop exit).`,
  );
}

async function callGroq(prompt: string, maxTokens: number): Promise<string> {
  const key = requireEnv("GROQ_API_KEY");
  const model = (process.env.GROQ_MODEL || "llama-3.1-70b-versatile").trim();

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: prompt }],
      max_tokens: maxTokens,
      temperature: 0.6,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Groq API error ${res.status}: ${errText}`);
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const text = data.choices?.[0]?.message?.content ?? "";
  return text.trim();
}

export async function callLlm(prompt: string, maxTokens: number): Promise<string> {
  const provider = pickProvider();
  if (provider === "claude") return callClaude(prompt, maxTokens);
  if (provider === "gemini") return callGemini(prompt, maxTokens);
  if (provider === "groq") return callGroq(prompt, maxTokens);
  return JSON.stringify(sampleRecipesFromPrompt(prompt));
}

