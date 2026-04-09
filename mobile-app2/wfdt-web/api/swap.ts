import type { VercelRequest, VercelResponse } from "@vercel/node";
import { swapIngredient } from "../lib-server/meals.js";

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
    const { ingredientName, recipeName } = body as {
      ingredientName?: string;
      recipeName?: string;
    };
    if (!ingredientName || !recipeName) {
      res.status(400).json({ error: "ingredientName and recipeName required" });
      return;
    }
    const substitute = await swapIngredient(ingredientName, recipeName);
    res.status(200).json({ substitute });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    res.status(500).json({ error: message });
  }
}
