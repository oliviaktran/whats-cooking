import { useMemo, useReducer, type ReactNode } from "react";
import { appReducer, initialAppState } from "./appReducer";
import { AppStateContext } from "./appStateContext";

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialAppState);
  const value = useMemo(() => ({ state, dispatch }), [state, dispatch]);
  return (
    <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>
  );
}
