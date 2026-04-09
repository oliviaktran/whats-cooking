import { useContext } from "react";
import { AppStateContext } from "./appStateContext";

export function useApp() {
  const v = useContext(AppStateContext);
  if (!v) throw new Error("useApp outside AppProvider");
  return v;
}
