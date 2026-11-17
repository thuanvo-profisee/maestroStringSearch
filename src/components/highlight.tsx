function escapeRegExp(text: string) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

export function Highlight({ text, term, enabled = true }: { text: string; term: string; enabled?: boolean }) {
  if (!enabled || !term) return <>{text}</>
  const parts = text.split(new RegExp(`(${escapeRegExp(term)})`, "gi"))
  return (
    <>
      {parts.map((part, index) =>
        index % 2 === 1 ? (
          <mark key={index} className="rounded-sm bg-primary/15 px-0.5 font-medium text-foreground">
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </>
  )
}
