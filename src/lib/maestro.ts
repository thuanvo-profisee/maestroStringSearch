export type SearchMode = "value" | "key" | "both"

export type StringEntry = { key: string; value: string }

export type MaestroStrings = Record<string, string>

async function getActiveTabId(): Promise<number> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  if (!tab?.id) throw new Error("No active tab found")
  return tab.id
}

/**
 * Reads window.maestroStrings from the page. Returns null when the page does not define it.
 * The injected function runs in the page, so it must not use anything from this module.
 */
export async function getMaestroStrings(): Promise<MaestroStrings | null> {
  const tabId = await getActiveTabId()
  const [injection] = await chrome.scripting.executeScript({
    target: { tabId },
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

export type SearchResult = { total: number; results: StringEntry[] }

/**
 * Searches window.maestroStrings in the page, so only the matches are sent back to the popup.
 * Returns null when the page does not define it. The injected function must be self-contained.
 */
export async function searchMaestroStrings(term: string, mode: SearchMode): Promise<SearchResult | null> {
  const tabId = await getActiveTabId()
  const [injection] = await chrome.scripting.executeScript({
    target: { tabId },
    world: "MAIN",
    args: [term, mode],
    func: (term: string, mode: SearchMode) => {
      const source = (window as unknown as { maestroStrings?: unknown }).maestroStrings
      if (!source || typeof source !== "object") return null
      const needle = term.toLowerCase()
      const entries = Object.entries(source)
      const results: { key: string; value: string }[] = []
      for (const [key, rawValue] of entries) {
        const value = String(rawValue)
        const keyMatch = mode !== "value" && key.toLowerCase().includes(needle)
        const valueMatch = mode !== "key" && value.toLowerCase().includes(needle)
        if (keyMatch || valueMatch) results.push({ key, value })
      }
      return { total: entries.length, results }
    },
  })
  return (injection?.result as SearchResult | null | undefined) ?? null
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
