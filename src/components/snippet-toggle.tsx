import { clsx } from "clsx";
import { btn, btnActive } from "./ui";

export function SnippetToggle({
  value,
  onChange,
}: {
  value: "node" | "go";
  onChange: (v: "node" | "go") => void;
}) {
  return (
    <div className="flex gap-1">
      {(["node", "go"] as const).map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => onChange(l)}
          className={clsx(btn, "!px-2 !py-1 text-xs", value === l && btnActive)}
        >
          {l === "node" ? "Node.js" : "Go"}
        </button>
      ))}
    </div>
  );
}
