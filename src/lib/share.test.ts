import { describe, expect, it } from "vitest";
import { decodeSnapshot, encodeSnapshot, readShareHash, shareUrl } from "./share";
import { sampleProjects } from "./sample-data";

describe("share links", () => {
  const project = sampleProjects()[0];

  it("round-trips a project snapshot", () => {
    const encoded = encodeSnapshot(project, "2026-05-01T10:00:00.000Z");
    expect(decodeSnapshot(encoded)).toEqual({ v: 1, at: "2026-05-01T10:00:00.000Z", project });
  });

  it("produces a URL-safe hash", () => {
    const url = shareUrl(project, { origin: "https://example.com", pathname: "/studioflow/" });
    expect(url.startsWith("https://example.com/studioflow/#share=")).toBe(true);
    expect(url).not.toMatch(/[\s"<>]/);
    expect(readShareHash(new URL(url).hash)).not.toBeNull();
  });

  it("rejects tampered or truncated links", () => {
    const encoded = encodeSnapshot(project);
    expect(decodeSnapshot(encoded.slice(0, 40))).toBeNull();
    expect(decodeSnapshot("not-a-snapshot")).toBeNull();
  });

  it("rejects valid JSON that is not a project", () => {
    expect(decodeSnapshot(encodeSnapshot({ ...project, color: "javascript:alert(1)" }))).toBeNull();
  });
});
