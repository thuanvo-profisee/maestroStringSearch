import { useEffect, useState } from "react"
import { CheckIcon, CopyIcon } from "lucide-react"
import { toast } from "sonner"

import { Highlight } from "@/components/highlight"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import type { SearchMode, StringEntry } from "@/lib/maestro"

type ResultItemProps = {
  entry: StringEntry
  term: string
  mode: SearchMode
}

export function ResultItem({ entry, term, mode }: ResultItemProps) {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!copied) return
    const timer = setTimeout(() => setCopied(false), 1500)
    return () => clearTimeout(timer)
  }, [copied])

  async function copyKey() {
    try {
      await navigator.clipboard.writeText(entry.key)
      setCopied(true)
    } catch {
      toast.error("Could not copy the key")
    }
  }

  return (
    <div className="flex items-start gap-2 rounded-lg border bg-card px-3 py-2.5 transition-colors hover:bg-muted/50">
      <div className="min-w-0 flex-1">
        <div className="font-mono text-xs font-semibold break-all text-foreground">
          <Highlight text={entry.key} term={term} enabled={mode !== "value"} />
        </div>
        <div className="mt-1 text-[0.8rem] leading-relaxed break-words text-muted-foreground">
          <Highlight text={entry.value} term={term} enabled={mode !== "key"} />
        </div>
      </div>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon-xs" onClick={copyKey} aria-label={`Copy key ${entry.key}`}>
            {copied ? <CheckIcon className="text-emerald-600 dark:text-emerald-400" /> : <CopyIcon />}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="left">{copied ? "Copied" : "Copy key"}</TooltipContent>
      </Tooltip>
    </div>
  )
}
