export type ShortcutAction = "new-task" | "search" | "help" | "share";

export const SHORTCUTS: { keys: string; action: ShortcutAction; label: string }[] = [
  { keys: "N", action: "new-task", label: "New task in To do" },
  { keys: "/", action: "search", label: "Search tasks" },
  { keys: "S", action: "share", label: "Copy the client status link" },
  { keys: "?", action: "help", label: "Show keyboard shortcuts" },
];

type KeyLike = {
  key: string;
  metaKey?: boolean;
  ctrlKey?: boolean;
  altKey?: boolean;
  target?: EventTarget | null;
};

/** True when the user is typing somewhere, so single-key shortcuts must not fire. */
export function isTypingTarget(target: EventTarget | null | undefined): boolean {
  if (!target || typeof (target as HTMLElement).tagName !== "string") return false;
  const el = target as HTMLElement;
  const tag = el.tagName.toLowerCase();
  return tag === "input" || tag === "textarea" || tag === "select" || el.isContentEditable === true || el.getAttribute?.("role") === "combobox";
}

/** Maps a keydown event to a workspace shortcut, or null. */
export function shortcutFor(e: KeyLike): ShortcutAction | null {
  if (e.metaKey || e.ctrlKey || e.altKey) return null;
  if (isTypingTarget(e.target)) return null;
  switch (e.key) {
    case "n":
    case "N":
      return "new-task";
    case "/":
      return "search";
    case "s":
    case "S":
      return "share";
    case "?":
      return "help";
    default:
      return null;
  }
}
