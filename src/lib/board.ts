import { arrayMove } from "@dnd-kit/sortable";
import { DONE_COLUMN, REVIEW_COLUMN, type Project, type Task } from "./types";

/**
 * Moves a task while it is dragged over another task or an empty column.
 * Pure and immutable: never mutates the incoming array or its tasks.
 */
export function moveTask(
  tasks: Task[],
  activeId: string,
  over: { id: string; type: "Task" | "Column" },
  now = new Date().toISOString()
): Task[] {
  const activeIndex = tasks.findIndex((t) => t.id === activeId);
  if (activeIndex === -1) return tasks;
  const active = tasks[activeIndex];

  const withColumn = (columnId: string): Task => ({
    ...active,
    columnId,
    completedAt: columnId === DONE_COLUMN ? active.completedAt ?? now : undefined,
  });

  if (over.type === "Column") {
    if (active.columnId === over.id) return tasks;
    const next = [...tasks];
    next[activeIndex] = withColumn(over.id);
    return next;
  }

  const overIndex = tasks.findIndex((t) => t.id === over.id);
  if (overIndex === -1 || overIndex === activeIndex) return tasks;
  const overTask = tasks[overIndex];
  const next = [...tasks];
  if (active.columnId !== overTask.columnId) {
    next[activeIndex] = withColumn(overTask.columnId);
    // Place the task just before the one it is hovering, never at index -1
    return arrayMove(next, activeIndex, Math.max(0, activeIndex < overIndex ? overIndex - 1 : overIndex));
  }
  return arrayMove(next, activeIndex, overIndex);
}

/**
 * Parses a date-only string ("2026-03-20") as a local calendar day.
 * `new Date("2026-03-20")` is UTC midnight, which shows the wrong day and
 * miscounts "days left" for anyone west or east of UTC.
 */
export function parseDay(value: string): Date {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : new Date(value);
}

export const formatDay = (value: string, opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" }) =>
  parseDay(value).toLocaleDateString(undefined, opts);

export const isOverdue = (t: Task, today = startOfToday()) =>
  !!t.due && t.columnId !== DONE_COLUMN && parseDay(t.due).getTime() < today;

export function projectStats(p: Project, today = startOfToday()) {
  const total = p.tasks.length;
  const done = p.tasks.filter((t) => t.columnId === DONE_COLUMN).length;
  const overdue = p.tasks.filter((t) => isOverdue(t, today)).length;
  const awaitingClient = p.tasks.filter(
    (t) => t.columnId !== DONE_COLUMN && (t.columnId === REVIEW_COLUMN || t.owner === "client")
  ).length;
  const daysLeft = p.dueDate ? Math.round((parseDay(p.dueDate).getTime() - today) / 86_400_000) : undefined;
  return { total, done, overdue, awaitingClient, progress: total ? done / total : 0, daysLeft };
}

export type TaskFilter = { query: string; priority: "all" | Task["priority"]; owner: "all" | Task["owner"] };

export function filterTasks(tasks: Task[], f: TaskFilter) {
  const q = f.query.trim().toLowerCase();
  return tasks.filter(
    (t) =>
      (f.priority === "all" || t.priority === f.priority) &&
      (f.owner === "all" || t.owner === f.owner) &&
      (!q || t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q) || t.tag.toLowerCase().includes(q))
  );
}

export function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export const uid = (prefix: string) => `${prefix}_${Math.random().toString(36).slice(2, 9)}${Date.now().toString(36).slice(-3)}`;
