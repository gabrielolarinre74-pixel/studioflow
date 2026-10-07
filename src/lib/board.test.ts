import { describe, expect, it } from "vitest";
import { filterTasks, moveTask, projectStats } from "./board";
import { sampleProjects } from "./sample-data";
import type { Task } from "./types";

const t = (id: string, columnId: string, extra: Partial<Task> = {}): Task => ({
  id,
  columnId,
  title: `Task ${id}`,
  description: "",
  priority: "medium",
  owner: "studio",
  tag: "Design",
  createdAt: "2026-01-01T00:00:00.000Z",
  ...extra,
});

describe("moveTask", () => {
  const tasks = [t("a", "todo"), t("b", "todo"), t("c", "in-progress"), t("d", "done")];

  it("does not mutate the original array or task objects", () => {
    const snapshot = structuredClone(tasks);
    moveTask(tasks, "a", { id: "c", type: "Task" });
    expect(tasks).toEqual(snapshot);
  });

  it("moves a task onto an empty column", () => {
    const next = moveTask(tasks, "a", { id: "review", type: "Column" });
    expect(next.find((x) => x.id === "a")?.columnId).toBe("review");
  });

  it("reorders within a column", () => {
    const next = moveTask(tasks, "b", { id: "a", type: "Task" });
    expect(next.map((x) => x.id)).toEqual(["b", "a", "c", "d"]);
  });

  it("never produces a negative index when dropped above the first task", () => {
    const next = moveTask([t("x", "todo"), t("y", "doing")], "y", { id: "x", type: "Task" });
    expect(next).toHaveLength(2);
    expect(next.find((x) => x.id === "y")?.columnId).toBe("todo");
  });

  it("stamps completedAt when moved to Done and clears it when moved out", () => {
    const done = moveTask(tasks, "a", { id: "done", type: "Column" }, "2026-02-02T00:00:00.000Z");
    expect(done.find((x) => x.id === "a")?.completedAt).toBe("2026-02-02T00:00:00.000Z");
    const back = moveTask(done, "a", { id: "todo", type: "Column" });
    expect(back.find((x) => x.id === "a")?.completedAt).toBeUndefined();
  });

  it("ignores unknown ids", () => {
    expect(moveTask(tasks, "zzz", { id: "todo", type: "Column" })).toBe(tasks);
  });
});

describe("projectStats", () => {
  it("calculates progress, overdue and waiting-on-client counts", () => {
    const today = new Date("2026-03-10T00:00:00").getTime();
    const stats = projectStats(
      {
        ...sampleProjects()[0],
        dueDate: "2026-03-20",
        tasks: [
          t("1", "done"),
          t("2", "todo", { due: "2026-03-01" }),
          t("3", "review"),
          t("4", "todo", { owner: "client" }),
          t("5", "done", { due: "2026-03-01" }),
        ],
      },
      today
    );
    expect(stats).toMatchObject({ total: 5, done: 2, overdue: 1, awaitingClient: 2, progress: 0.4, daysLeft: 10 });
  });
});

describe("filterTasks", () => {
  const tasks = [t("1", "todo", { title: "Homepage hero", priority: "high" }), t("2", "todo", { owner: "client", tag: "Content" })];
  it("filters by text, priority and owner", () => {
    expect(filterTasks(tasks, { query: "hero", priority: "all", owner: "all" }).map((x) => x.id)).toEqual(["1"]);
    expect(filterTasks(tasks, { query: "", priority: "high", owner: "all" }).map((x) => x.id)).toEqual(["1"]);
    expect(filterTasks(tasks, { query: "content", priority: "all", owner: "client" }).map((x) => x.id)).toEqual(["2"]);
  });
});
