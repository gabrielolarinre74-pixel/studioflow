import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from "lz-string";
import { z } from "zod";
import { projectSchema, type Project } from "./types";

const snapshotSchema = z.object({
  v: z.literal(1),
  at: z.string(),
  project: projectSchema,
});
export type Snapshot = z.infer<typeof snapshotSchema>;

/**
 * Encodes a read-only snapshot of a project into a URL-safe string, so a
 * client can open a status page without an account or a backend.
 */
export function encodeSnapshot(project: Project, at = new Date().toISOString()): string {
  return compressToEncodedURIComponent(JSON.stringify({ v: 1, at, project } satisfies Snapshot));
}

/** Returns null for anything that is not a valid snapshot (tampered or truncated links). */
export function decodeSnapshot(encoded: string): Snapshot | null {
  try {
    const json = decompressFromEncodedURIComponent(encoded);
    if (!json) return null;
    const parsed = snapshotSchema.safeParse(JSON.parse(json));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

export function shareUrl(project: Project, location: Pick<Location, "origin" | "pathname"> = window.location) {
  return `${location.origin}${location.pathname}#share=${encodeSnapshot(project)}`;
}

export function readShareHash(hash: string): string | null {
  const m = hash.match(/^#share=(.+)$/);
  return m ? m[1] : null;
}
