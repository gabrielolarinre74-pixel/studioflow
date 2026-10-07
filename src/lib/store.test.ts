import { beforeEach, describe, expect, it } from "vitest";
import { useStore } from "./store";

describe("store", () => {
  beforeEach(() => {
    localStorage.clear();
    useStore.getState().resetDemo();
  });

  it("creates a project with default columns and makes it active", () => {
    const id = useStore.getState().addProject({ name: "Landing page", client: "Acme", description: "", color: "#7c3aed" });
    const s = useStore.getState();
    expect(s.activeId).toBe(id);
    expect(s.projects.find((p) => p.id === id)?.columns.map((c) => c.id)).toEqual(["todo", "in-progress", "review", "done"]);
  });

  it("adds, updates and deletes tasks", () => {
    const pid = useStore.getState().projects[0].id;
    useStore.getState().addTask(pid, { columnId: "todo", title: "Write copy", description: "", priority: "low", owner: "client", tag: "Content" });
    let task = useStore.getState().projects[0].tasks.at(-1)!;
    expect(task.title).toBe("Write copy");
    useStore.getState().updateTask(pid, task.id, { columnId: "done" });
    task = useStore.getState().projects[0].tasks.find((t) => t.id === task.id)!;
    expect(task.completedAt).toBeDefined();
    useStore.getState().deleteTask(pid, task.id);
    expect(useStore.getState().projects[0].tasks.some((t) => t.id === task.id)).toBe(false);
  });

  it("validates imports and never overwrites existing projects", () => {
    const before = useStore.getState().projects.length;
    expect(useStore.getState().importProjects({ projects: [{ nope: true }] }).ok).toBe(false);
    const copy = structuredClone(useStore.getState().projects[0]);
    const res = useStore.getState().importProjects({ projects: [copy] });
    expect(res.ok).toBe(true);
    const ids = useStore.getState().projects.map((p) => p.id);
    expect(ids).toHaveLength(before + 1);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("moves the active project when the active one is deleted", () => {
    const { activeId } = useStore.getState();
    useStore.getState().deleteProject(activeId);
    expect(useStore.getState().activeId).not.toBe(activeId);
  });
});
