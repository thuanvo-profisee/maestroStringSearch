import { useRef } from "react"
import { useVirtualizer } from "@tanstack/react-virtual"

import { ResultItem } from "@/components/result-item"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { SearchMode, StringEntry } from "@/lib/maestro"

type ResultListProps = {
  results: StringEntry[]
  term: string
  mode: SearchMode
}

/** Renders only the rows in view, so a search with thousands of matches stays fast. */
export function ResultList({ results, term, mode }: ResultListProps) {
  const viewportRef = useRef<HTMLDivElement>(null)
  const virtualizer = useVirtualizer({
    count: results.length,
    getScrollElement: () => viewportRef.current,
    estimateSize: () => 64,
    gap: 8,
    overscan: 6,
  })

  return (
    <ScrollArea className="h-72" viewportRef={viewportRef}>
      <div className="relative w-full" style={{ height: virtualizer.getTotalSize() }}>
        {virtualizer.getVirtualItems().map((row) => {
          const entry = results[row.index]
          return (
            <div
              key={entry.key}
              ref={virtualizer.measureElement}
              data-index={row.index}
              className="absolute top-0 left-0 w-full pr-3"
              style={{ transform: `translateY(${row.start}px)` }}
            >
              <ResultItem entry={entry} term={term} mode={mode} />
            </div>
          )
        })}
      </div>
    </ScrollArea>
  )
}
