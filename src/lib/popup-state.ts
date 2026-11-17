import type { SearchMode, StringEntry } from "@/lib/maestro"

export type SearchStatus =
  | { kind: "idle" }
  | { kind: "empty-query" }
  | { kind: "not-found" }
  | { kind: "error"; message: string }
  | { kind: "done"; term: string; mode: SearchMode; total: number }

export type PopupState = {
  query: string
  mode: SearchMode
  status: SearchStatus
  results: StringEntry[]
}

export const initialPopupState: PopupState = {
  query: "",
  mode: "value",
  status: { kind: "idle" },
  results: [],
}

const STORAGE_KEY = "popupState"

// chrome.storage.local keeps the state after the popup closes.
export async function loadPopupState(): Promise<PopupState> {
  const stored = await chrome.storage.local.get(STORAGE_KEY)
  return { ...initialPopupState, ...(stored[STORAGE_KEY] as Partial<PopupState> | undefined) }
}

export function savePopupState(state: PopupState) {
  return chrome.storage.local.set({ [STORAGE_KEY]: state })
}
