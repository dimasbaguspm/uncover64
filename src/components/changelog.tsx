import { CHANGELOG } from "@/constants/changelog";

export function Changelog() {
  return (
    <>
      {CHANGELOG.map((entry) => (
        <div
          key={entry.version}
          className="mb-2 rounded-lg border border-edge bg-surface-2/40 p-3 last:mb-0"
        >
          <div className="flex items-baseline justify-between">
            <span className="text-sm font-semibold text-accent">v{entry.version}</span>
            <span className="text-xs text-faint">{entry.date}</span>
          </div>
          <ul className="mt-1.5 list-inside list-disc space-y-0.5 text-xs text-dim">
            {entry.items.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </div>
      ))}
    </>
  );
}
