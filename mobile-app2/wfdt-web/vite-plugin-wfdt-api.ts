import type { IncomingMessage, ServerResponse } from "http";
import type { Plugin } from "vite";
import type { GeneratePayload } from "./lib-server/meals.js";
import { generateRecipes, swapIngredient } from "./lib-server/meals.js";

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (c) => chunks.push(c as Buffer));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

function sendJson(res: ServerResponse, status: number, data: unknown) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(data));
}

/** Lets Expo web (other localhost ports) call the dev API from the browser. */
function corsDevApi(res: ServerResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

export function wfdtDevApi(): Plugin {
  return {
    name: "wfdt-dev-api",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url?.split("?")[0] ?? "";
        if (url === "/api/generate" || url === "/api/swap") {
          corsDevApi(res);
          if (req.method === "OPTIONS") {
            res.statusCode = 204;
            res.end();
            return;
          }
        }
        if (req.method === "POST" && url === "/api/generate") {
          try {
            const raw = await readBody(req);
            const body = JSON.parse(raw) as unknown;
            const o = body as Record<string, unknown>;
            const prompt = typeof o.prompt === "string" ? o.prompt : null;
            const payload = body as GeneratePayload;
            const recipes = await generateRecipes(prompt ? { payload, prompt } : payload);
            sendJson(res, 200, { recipes });
          } catch (e) {
            const message = e instanceof Error ? e.message : "Unknown error";
            sendJson(res, 500, { error: message });
          }
          return;
        }
        if (req.method === "POST" && url === "/api/swap") {
          try {
            const raw = await readBody(req);
            const { ingredientName, recipeName } = JSON.parse(raw) as {
              ingredientName?: string;
              recipeName?: string;
            };
            if (!ingredientName || !recipeName) {
              sendJson(res, 400, {
                error: "ingredientName and recipeName required",
              });
              return;
            }
            const substitute = await swapIngredient(ingredientName, recipeName);
            sendJson(res, 200, { substitute });
          } catch (e) {
            const message = e instanceof Error ? e.message : "Unknown error";
            sendJson(res, 500, { error: message });
          }
          return;
        }
        next();
      });
    },
  };
}
