
import Constants from 'expo-constants';
import { Platform } from 'react-native';

import { normalizeRecipes } from '@/lib/normalizeRecipes';
import type { GenerateMealPayload, Recipe } from '@/lib/types/recipe';

function devDefaultBase(): string {
  // When running on a physical device, `localhost` points at the phone.
  // Expo usually exposes the dev host as something like "10.0.0.x:8081".
  const hostUri =
    (Constants.expoConfig as { hostUri?: string } | undefined)?.hostUri ??
    (Constants as unknown as { expoGoConfig?: { debuggerHost?: string } }).expoGoConfig
      ?.debuggerHost ??
    (Constants as unknown as { manifest?: { debuggerHost?: string } }).manifest?.debuggerHost;

  const devHost =
    typeof hostUri === 'string' && hostUri.length > 0 ? hostUri.split(':')[0] : undefined;

  return Platform.select({
    // Android emulator special-case: route to host via 10.0.2.2
    android: 'http://10.0.2.2:5173',
    // iOS simulator can use localhost; physical devices need LAN IP.
    default: devHost ? `http://${devHost}:5173` : 'http://localhost:5173',
  })!;
}

export function getWfdtApiBaseUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_WFDT_API_URL?.replace(/\/$/, '');
  if (fromEnv) return fromEnv;
  if (__DEV__) return devDefaultBase();
  return '';
}

export async function generateMeals(payload: GenerateMealPayload): Promise<Recipe[]> {
  const base = getWfdtApiBaseUrl();
  if (!base) {
    throw new Error(
      'Set EXPO_PUBLIC_WFDT_API_URL to your wfdt-web origin (e.g. https://your-app.vercel.app)',
    );
  }

  let res: Response;
  try {
    res = await fetch(`${base}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch (e) {
    const hint =
      e instanceof Error && e.message === 'Failed to fetch'
        ? ' (is wfdt-web running on port 5173? If using Expo web, CORS must be enabled on the API — restart `wfdt-web` after updating the Vite plugin.)'
        : '';
    throw new Error(
      `${e instanceof Error ? e.message : 'Network error'}${hint}`,
    );
  }

  const raw = await res.text();
  let json: { recipes?: unknown; error?: string };
  try {
    json = JSON.parse(raw) as { recipes?: unknown; error?: string };
  } catch {
    throw new Error(
      `Bad response from ${base}/api/generate (${res.status}): ${raw.slice(0, 120)}`,
    );
  }
  if (!res.ok) {
    throw new Error(json.error ?? 'Generation failed');
  }
  return normalizeRecipes(json.recipes);
}
