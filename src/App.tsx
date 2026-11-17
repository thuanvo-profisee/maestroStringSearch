import { memo, useEffect, useRef, useState, type ReactNode } from "react"
import { DownloadIcon, FileWarningIcon, Loader2Icon, SearchIcon, SearchXIcon, TriangleAlertIcon } from "lucide-react"
import { toast } from "sonner"

import { ResultList } from "@/components/result-list"
import { SnapshotBar } from "@/components/snapshot-bar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Toaster } from "@/components/ui/sonner"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { TooltipProvider } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import {
  downloadJson,
  findStrings,
  getMaestroStrings,
  searchMaestroStrings,
  type MaestroStrings,
  type SearchMode,
  type StringEntry,
} from "@/lib/maestro"
import {
  initialPopupState,
  loadPopupState,
  savePopupState,
  type PopupState,
  type SearchStatus,
} from "@/lib/popup-state"
import {
  deleteSnapshot,
  listSnapshots,
  loadSnapshotStrings,
  saveSnapshot,
  type SnapshotInfo,
} from "@/lib/snapshots"

const MODE_LABELS: Record<SearchMode, string> = {
  value: "Value",
  key: "Key",
  both: "Both",
}

// Saving thousands of results on each keystroke makes typing slow, so wait for a pause.
const SAVE_DELAY_MS = 300

function toObject(entries: StringEntry[]) {
  return Object.fromEntries(entries.map(({ key, value }) => [key, value]))
}

function fileSlug(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "snapshot"
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error)
}

export function App() {
  const [state, setState] = useState<PopupState>(initialPopupState)
  const [loaded, setLoaded] = useState(false)
  const [searching, setSearching] = useState(false)
  const [saving, setSaving] = useState(false)
  const [snapshots, setSnapshots] = useState<SnapshotInfo[]>([])
  const snapshotCache = useRef(new Map<string, MaestroStrings>())
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    Promise.all([loadPopupState(), listSnapshots()])
      .then(([saved, list]) => {
        const snapshotId = list.some((snapshot) => snapshot.id === saved.snapshotId) ? saved.snapshotId : null
        setState({ ...saved, snapshotId })
        setSnapshots(list)
      })
      .finally(() => setLoaded(true))
  }, [])

  useEffect(() => {
    if (!loaded) return
    const timer = setTimeout(() => savePopupState(state), SAVE_DELAY_MS)
    return () => clearTimeout(timer)
  }, [state, loaded])

  useEffect(() => {
    if (loaded) inputRef.current?.focus()
  }, [loaded])

  const update = (patch: Partial<PopupState>) => setState((current) => ({ ...current, ...patch }))

  async function readSnapshot(id: string) {
    let strings = snapshotCache.current.get(id)
    if (!strings) {
      const stored = await loadSnapshotStrings(id)
      if (!stored) throw new Error("This snapshot is no longer saved")
      strings = stored
      snapshotCache.current.set(id, strings)
    }
    return strings
  }

  async function search(snapshotId = state.snapshotId) {
    const term = state.query.trim()
    if (!term) {
      update({ status: { kind: "empty-query" }, results: [] })
      return
    }

    const mode = state.mode
    setSearching(true)
    try {
      const found = snapshotId
        ? findStrings(term, mode, await readSnapshot(snapshotId))
        : await searchMaestroStrings(term, mode)
      if (!found) {
        update({ status: { kind: "not-found" }, results: [] })
        return
      }
      update({ status: { kind: "done", term, mode, total: found.total }, results: found.results })
    } catch (error) {
      update({ status: { kind: "error", message: errorMessage(error) }, results: [] })
    } finally {
      setSearching(false)
    }
  }

  async function exportAll() {
    try {
      const snapshot = snapshots.find(({ id }) => id === state.snapshotId)
      const strings = snapshot ? await readSnapshot(snapshot.id) : await getMaestroStrings()
      if (!strings) {
        toast.error("window.maestroStrings not found on this page")
        return
      }
      downloadJson(snapshot ? `maestro-strings-${fileSlug(snapshot.title)}.json` : "maestro-strings.json", strings)
      toast.success(`Exported ${Object.keys(strings).length} strings`)
    } catch (error) {
      toast.error(errorMessage(error))
    }
  }

  function exportResults() {
    downloadJson("maestro-strings-results.json", toObject(state.results))
    toast.success(`Exported ${state.results.length} results`)
  }

  /** Switches the search to a snapshot, or to the current tab when id is null. */
  function selectSource(snapshotId: string | null) {
    update({ snapshotId })
    if (state.query.trim()) search(snapshotId)
  }

  async function saveCurrentTab() {
    setSaving(true)
    try {
      const snapshot = await saveSnapshot()
      if (!snapshot) {
        toast.error("window.maestroStrings not found on this page")
        return
      }
      setSnapshots((current) => [snapshot, ...current])
      selectSource(snapshot.id)
      toast.success(`Saved ${snapshot.count.toLocaleString()} strings. You can search them from any tab.`)
    } catch (error) {
      toast.error(errorMessage(error))
    } finally {
      setSaving(false)
    }
  }

  async function removeSnapshot(id: string) {
    try {
      setSnapshots(await deleteSnapshot(id))
      snapshotCache.current.delete(id)
      if (state.snapshotId === id) selectSource(null)
    } catch (error) {
      toast.error(errorMessage(error))
    }
  }

  const { status, results } = state

  return (
    <TooltipProvider>
      <div className="flex flex-col gap-4 p-4">
        <header className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <img src="icons/icon-48.png" alt="" className="size-8" />
            <div>
              <h1 className="text-base font-semibold">Maestro Strings Search</h1>
              <p className="text-xs text-muted-foreground">Search by key or value</p>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <DownloadIcon />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onSelect={exportAll}>All strings as JSON</DropdownMenuItem>
              <DropdownMenuItem onSelect={exportResults} disabled={results.length === 0}>
                Results as JSON
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        <SnapshotBar
          snapshots={snapshots}
          activeId={state.snapshotId}
          saving={saving}
          onSave={saveCurrentTab}
          onLoad={selectSource}
          onDelete={removeSnapshot}
        />

        <form
          className="flex flex-col gap-2"
          onSubmit={(event) => {
            event.preventDefault()
            search()
          }}
        >
          <div className="relative">
            <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              ref={inputRef}
              value={state.query}
              onChange={(event) => update({ query: event.target.value })}
              placeholder={`Search by ${state.mode === "both" ? "key or value" : state.mode}...`}
              className="pl-8"
              disabled={!loaded}
            />
          </div>
          <div className="flex items-center gap-2">
            <ToggleGroup
              type="single"
              variant="outline"
              size="sm"
              value={state.mode}
              onValueChange={(mode) => mode && update({ mode: mode as SearchMode })}
              aria-label="Search in"
            >
              {(Object.keys(MODE_LABELS) as SearchMode[]).map((mode) => (
                <ToggleGroupItem key={mode} value={mode}>
                  {MODE_LABELS[mode]}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
            <Button type="submit" size="sm" className="flex-1" disabled={!loaded || searching}>
              {searching ? <Loader2Icon className="animate-spin" /> : <SearchIcon />}
              {searching ? "Searching..." : "Search"}
            </Button>
          </div>
        </form>

        <section className="flex flex-col gap-2 border-t pt-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-muted-foreground">Results</h2>
            <Badge variant="secondary">
              {status.kind === "done" ? `${results.length.toLocaleString()} of ${status.total.toLocaleString()}` : "0 found"}
            </Badge>
          </div>
          <Results status={status} results={results} />
        </section>
      </div>
      <Toaster position="bottom-center" />
    </TooltipProvider>
  )
}

// Memoized so typing in the search box does not render the results again.
const Results = memo(function Results({ status, results }: { status: SearchStatus; results: StringEntry[] }) {
  switch (status.kind) {
    case "idle":
      return <Message icon={<SearchIcon />}>Enter a search term to find matching strings</Message>
    case "empty-query":
      return <Message icon={<TriangleAlertIcon />}>Please enter a search term</Message>
    case "not-found":
      return (
        <Message icon={<FileWarningIcon />} tone="error">
          window.maestroStrings not found on this page
        </Message>
      )
    case "error":
      return (
        <Message icon={<TriangleAlertIcon />} tone="error">
          {status.message}
        </Message>
      )
    case "done":
      if (results.length === 0) {
        return <Message icon={<SearchXIcon />}>No matches found for "{status.term}"</Message>
      }
      return <ResultList results={results} term={status.term} mode={status.mode} />
  }
})

function Message({ icon, tone, children }: { icon: ReactNode; tone?: "error"; children: ReactNode }) {
  return (
    <div
      className={cn(
        "flex h-72 flex-col items-center justify-center gap-3 px-6 text-center text-sm [&_svg]:size-8 [&_svg]:opacity-60",
        tone === "error" ? "text-destructive" : "text-muted-foreground"
      )}
    >
      {icon}
      <p>{children}</p>
    </div>
  )
}
