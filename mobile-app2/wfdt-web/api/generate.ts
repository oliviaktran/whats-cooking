import type { VercelRequest, VercelResponse } from "@vercel/node";
import type { GeneratePayload } from "../lib-server/meals.js";
import { generateRecipes } from "../lib-server/meals.js";

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const prompt = typeof body?.prompt === "string" ? body.prompt : null;
    const payload = body as GeneratePayload;
    const recipes = await generateRecipes(
      prompt ? { payload, prompt } : payload
    );
    res.status(200).json({ recipes });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    res.status(500).json({ error: message });
  }
}
