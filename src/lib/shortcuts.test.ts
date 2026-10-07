import { describe, expect, it } from "vitest";
import { isTypingTarget, shortcutFor } from "./shortcuts";

describe("shortcutFor", () => {
  it("maps single keys to actions", () => {
    expect(shortcutFor({ key: "n" })).toBe("new-task");
    expect(shortcutFor({ key: "N" })).toBe("new-task");
    expect(shortcutFor({ key: "/" })).toBe("search");
    expect(shortcutFor({ key: "s" })).toBe("share");
    expect(shortcutFor({ key: "?" })).toBe("help");
    expect(shortcutFor({ key: "x" })).toBeNull();
  });

  it("ignores keys pressed with modifiers so browser shortcuts keep working", () => {
    expect(shortcutFor({ key: "n", metaKey: true })).toBeNull();
    expect(shortcutFor({ key: "s", ctrlKey: true })).toBeNull();
    expect(shortcutFor({ key: "n", altKey: true })).toBeNull();
  });

  it("ignores keys while typing in a field", () => {
    const input = document.createElement("input");
    const textarea = document.createElement("textarea");
    const editable = document.createElement("div");
    editable.contentEditable = "true";
    expect(shortcutFor({ key: "n", target: input })).toBeNull();
    expect(shortcutFor({ key: "/", target: textarea })).toBeNull();
    expect(isTypingTarget(input)).toBe(true);
    expect(isTypingTarget(document.createElement("button"))).toBe(false);
    expect(isTypingTarget(null)).toBe(false);
  });
});
