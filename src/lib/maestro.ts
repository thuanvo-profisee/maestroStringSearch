export type SearchMode = "value" | "key" | "both"

export type StringEntry = { key: string; value: string }

export type MaestroStrings = Record<string, string>

export type SearchResult = { total: number; results: StringEntry[] }

export async function getActiveTab(): Promise<chrome.tabs.Tab & { id: number }> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  if (!tab?.id) throw new Error("No active tab found")
  return tab as chrome.tabs.Tab & { id: number }
}

/**
 * Searches the given strings, or window.maestroStrings when none are given.
 * It is self-contained because it also runs in the page. Returns null when there is nothing to search.
 */
export function findStrings(term: string, mode: SearchMode, strings?: MaestroStrings): SearchResult | null {
  const source = strings ?? (window as unknown as { maestroStrings?: unknown }).maestroStrings
  if (!source || typeof source !== "object") return null
  const needle = term.toLowerCase()
  const entries = Object.entries(source)
  const results: StringEntry[] = []
  for (const [key, rawValue] of entries) {
    const value = String(rawValue)
    const keyMatch = mode !== "value" && key.toLowerCase().includes(needle)
    const valueMatch = mode !== "key" && value.toLowerCase().includes(needle)
    if (keyMatch || valueMatch) results.push({ key, value })
  }
  return { total: entries.length, results }
}

/** Searches in the page, so only the matches are sent back to the popup. */
export async function searchMaestroStrings(term: string, mode: SearchMode): Promise<SearchResult | null> {
  const { id: tabId } = await getActiveTab()
  const [injection] = await chrome.scripting.executeScript({
    target: { tabId },
    world: "MAIN",
    func: findStrings,
    args: [term, mode],
  })
  return (injection?.result as SearchResult | null | undefined) ?? null
}

/**
 * Reads window.maestroStrings from the page. Returns null when the page does not define it.
 * The injected function runs in the page, so it must not use anything from this module.
 */
export async function getMaestroStrings(tabId?: number): Promise<MaestroStrings | null> {
  const target = { tabId: tabId ?? (await getActiveTab()).id }
  const [injection] = await chrome.scripting.executeScript({
    target,
    world: "MAIN",
    func: () => {
      const source = (window as unknown as { maestroStrings?: unknown }).maestroStrings
      if (!source || typeof source !== "object") return null
      const strings: Record<string, string> = {}
      for (const [key, value] of Object.entries(source)) strings[key] = String(value)
      return strings
    },
  })
  return (injection?.result as MaestroStrings | null | undefined) ?? null
}

export function downloadJson(fileName: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = fileName
  link.click()
  URL.revokeObjectURL(url)
}
