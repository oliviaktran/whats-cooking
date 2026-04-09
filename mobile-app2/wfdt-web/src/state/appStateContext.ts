import { createContext, type Dispatch } from "react";
import type { AppAction, AppState } from "../types";

export const AppStateContext = createContext<{
  state: AppState;
  dispatch: Dispatch<AppAction>;
} | null>(null);
