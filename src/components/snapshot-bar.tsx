import { ArchiveIcon, CheckIcon, GlobeIcon, HistoryIcon, Loader2Icon, SaveIcon, Trash2Icon, XIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { formatSavedAt, hostOf, type SnapshotInfo } from "@/lib/snapshots"

type SnapshotBarProps = {
  snapshots: SnapshotInfo[]
  activeId: string | null
  saving: boolean
  onSave: () => void
  onLoad: (id: string | null) => void
  onDelete: (id: string) => void
}

export function SnapshotBar({ snapshots, activeId, saving, onSave, onLoad, onDelete }: SnapshotBarProps) {
  const active = snapshots.find((snapshot) => snapshot.id === activeId)

  return (
    <div className="flex items-center gap-2 rounded-lg border bg-muted/40 py-1.5 pr-1.5 pl-2.5">
      {active ? (
        <ArchiveIcon className="size-4 shrink-0 text-muted-foreground" />
      ) : (
        <GlobeIcon className="size-4 shrink-0 text-muted-foreground" />
      )}
      <div className="min-w-0 flex-1 leading-tight">
        <div className="truncate text-xs font-medium">{active ? active.title : "Current tab"}</div>
        <div className="truncate text-[0.7rem] text-muted-foreground">
          {active
            ? `Snapshot · ${active.count.toLocaleString()} strings · ${formatSavedAt(active.savedAt)}`
            : "Searching the page you are on"}
        </div>
      </div>

      {active && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon-sm" onClick={() => onLoad(null)} aria-label="Search the current tab">
              <XIcon />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Search the current tab</TooltipContent>
        </Tooltip>
      )}

      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon-sm" onClick={onSave} disabled={saving} aria-label="Save snapshot">
            {saving ? <Loader2Icon className="animate-spin" /> : <SaveIcon />}
          </Button>
        </TooltipTrigger>
        <TooltipContent>Save this tab's strings as a snapshot</TooltipContent>
      </Tooltip>

      <Popover>
        <Tooltip>
          <TooltipTrigger asChild>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon-sm" aria-label="Saved snapshots" className="relative">
                <HistoryIcon />
                {snapshots.length > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 grid size-3.5 place-items-center rounded-full bg-primary text-[0.55rem] font-semibold text-primary-foreground">
                    {snapshots.length}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
          </TooltipTrigger>
          <TooltipContent>Saved snapshots</TooltipContent>
        </Tooltip>
        <PopoverContent align="end" className="w-80 p-0">
          <div className="border-b px-3 py-2 text-sm font-medium">Saved snapshots</div>
          {snapshots.length === 0 ? (
            <p className="px-3 py-6 text-center text-xs text-muted-foreground">
              No snapshots yet. Click the save button to keep this tab's strings.
            </p>
          ) : (
            <ul className="max-h-64 overflow-y-auto p-1">
              {snapshots.map((snapshot) => {
                const isActive = snapshot.id === activeId
                return (
                  <li key={snapshot.id} className="flex items-center gap-1 rounded-md px-2 py-1.5 hover:bg-muted/60">
                    <div className="min-w-0 flex-1 leading-tight">
                      <div className="truncate text-xs font-medium">{snapshot.title}</div>
                      <div className="truncate text-[0.7rem] text-muted-foreground">
                        {[hostOf(snapshot.url), `${snapshot.count.toLocaleString()} strings`, formatSavedAt(snapshot.savedAt)]
                          .filter(Boolean)
                          .join(" · ")}
                      </div>
                    </div>
                    <Button
                      variant={isActive ? "secondary" : "outline"}
                      size="xs"
                      onClick={() => onLoad(snapshot.id)}
                      disabled={isActive}
                    >
                      {isActive ? <CheckIcon /> : null}
                      {isActive ? "Loaded" : "Load"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => onDelete(snapshot.id)}
                      aria-label={`Delete snapshot ${snapshot.title}`}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2Icon />
                    </Button>
                  </li>
                )
              })}
            </ul>
          )}
        </PopoverContent>
      </Popover>
    </div>
  )
}
