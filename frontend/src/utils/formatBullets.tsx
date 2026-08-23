/**
 * Renders section content (achievements/professional_experience) as a real
 * bulleted list, with **bold** markdown segments rendered as <strong>.
 *
 * The agent is instructed to format bullets one per line and wrap key
 * skill-labels/metrics in **bold** -- this just renders that structure
 * instead of dumping it as a plain paragraph.
 */
export function FormattedBullets({ content }: { content: string }) {
  const lines = content
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)

  if (lines.length === 0) return null

  return (
    <ul className="list-disc space-y-1.5 pl-4 marker:text-accent">
      {lines.map((line, i) => (
        <li key={i} className="text-sm leading-relaxed text-paper">
          {renderInlineBold(line)}
        </li>
      ))}
    </ul>
  )
}

function renderInlineBold(line: string) {
  const parts = line.split(/(\*\*[^*]+\*\*)/g)
  return parts.map((part, i) =>
    part.startsWith('**') && part.endsWith('**') ? (
      <strong key={i} className="font-semibold text-paper">
        {part.slice(2, -2)}
      </strong>
    ) : (
      <span key={i}>{part}</span>
    ),
  )
}

/** Strips ** markers for plain-text uses (clipboard copy) -- nobody wants
 * literal asterisks pasted into their actual resume. */
export function stripBoldMarkers(content: string): string {
  return content.replace(/\*\*([^*]+)\*\*/g, '$1')
}
