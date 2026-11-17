import { getActiveTab, getMaestroStrings, type MaestroStrings } from "@/lib/maestro"

/** A copy of a tab's window.maestroStrings, kept so it can be searched from any tab. */
export type SnapshotInfo = {
  id: string
  title: string
  url: string
  savedAt: number
  count: number
}

// The list holds only metadata. Each snapshot's strings have their own key, so listing stays fast.
const INDEX_KEY = "snapshots"
const stringsKey = (id: string) => `snapshot:${id}`

export async function listSnapshots(): Promise<SnapshotInfo[]> {
  const stored = await chrome.storage.local.get(INDEX_KEY)
  return (stored[INDEX_KEY] as SnapshotInfo[] | undefined) ?? []
}

/** Saves the active tab's strings. Returns null when the tab has no window.maestroStrings. */
export async function saveSnapshot(): Promise<SnapshotInfo | null> {
  const tab = await getActiveTab()
  const strings = await getMaestroStrings(tab.id)
  if (!strings) return null

  const url = tab.url ?? ""
  const info: SnapshotInfo = {
    id: crypto.randomUUID(),
    title: tab.title || hostOf(url) || "Untitled tab",
    url,
    savedAt: Date.now(),
    count: Object.keys(strings).length,
  }
  const snapshots = await listSnapshots()
  await chrome.storage.local.set({
    [stringsKey(info.id)]: strings,
    [INDEX_KEY]: [info, ...snapshots],
  })
  return info
}

export async function loadSnapshotStrings(id: string): Promise<MaestroStrings | null> {
  const stored = await chrome.storage.local.get(stringsKey(id))
  return (stored[stringsKey(id)] as MaestroStrings | undefined) ?? null
}

export async function deleteSnapshot(id: string): Promise<SnapshotInfo[]> {
  const snapshots = (await listSnapshots()).filter((snapshot) => snapshot.id !== id)
  await chrome.storage.local.set({ [INDEX_KEY]: snapshots })
  await chrome.storage.local.remove(stringsKey(id))
  return snapshots
}

export function hostOf(url: string) {
  try {
    return new URL(url).host
  } catch {
    return ""
  }
}

export function formatSavedAt(savedAt: number) {
  return new Date(savedAt).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}
