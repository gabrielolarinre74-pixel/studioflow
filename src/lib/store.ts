import { create } from "zustand";
import { persist } from "zustand/middleware";
import { z } from "zod";
import { moveTask, uid } from "./board";
import { sampleProjects } from "./sample-data";
import { DEFAULT_COLUMNS, DONE_COLUMN, projectSchema, type Project, type Task } from "./types";

export type TaskInput = Omit<Task, "id" | "createdAt" | "completedAt">;
export type ProjectInput = Pick<Project, "name" | "client" | "description" | "color" | "dueDate">;

type State = {
  projects: Project[];
  activeId: string;
  setActive: (id: string) => void;
  addProject: (input: ProjectInput) => string;
  updateProject: (id: string, input: Partial<ProjectInput>) => void;
  deleteProject: (id: string) => void;
  addTask: (projectId: string, input: TaskInput) => void;
  updateTask: (projectId: string, taskId: string, input: Partial<TaskInput>) => void;
  deleteTask: (projectId: string, taskId: string) => void;
  dragTask: (projectId: string, activeId: string, over: { id: string; type: "Task" | "Column" }) => void;
  setColumns: (projectId: string, columns: Project["columns"]) => void;
  importProjects: (data: unknown) => { ok: true; count: number } | { ok: false; error: string };
  resetDemo: () => void;
};

const withProject = (projects: Project[], id: string, fn: (p: Project) => Project) =>
  projects.map((p) => (p.id === id ? fn(p) : p));

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      projects: sampleProjects(),
      activeId: "p-website",
      setActive: (id) => set({ activeId: id }),
      addProject: (input) => {
        const id = uid("p");
        const project: Project = {
          id,
          ...input,
          description: input.description ?? "",
          startDate: new Date().toISOString().slice(0, 10),
          columns: DEFAULT_COLUMNS,
          tasks: [],
        };
        set((s) => ({ projects: [...s.projects, project], activeId: id }));
        return id;
      },
      updateProject: (id, input) => set((s) => ({ projects: withProject(s.projects, id, (p) => ({ ...p, ...input })) })),
      deleteProject: (id) =>
        set((s) => {
          const projects = s.projects.filter((p) => p.id !== id);
          return { projects, activeId: s.activeId === id ? projects[0]?.id ?? "" : s.activeId };
        }),
      addTask: (projectId, input) =>
        set((s) => ({
          projects: withProject(s.projects, projectId, (p) => ({
            ...p,
            tasks: [
              ...p.tasks,
              {
                ...input,
                id: uid("t"),
                createdAt: new Date().toISOString(),
                completedAt: input.columnId === DONE_COLUMN ? new Date().toISOString() : undefined,
              },
            ],
          })),
        })),
      updateTask: (projectId, taskId, input) =>
        set((s) => ({
          projects: withProject(s.projects, projectId, (p) => ({
            ...p,
            tasks: p.tasks.map((t) => {
              if (t.id !== taskId) return t;
              const next = { ...t, ...input };
              next.completedAt = next.columnId === DONE_COLUMN ? t.completedAt ?? new Date().toISOString() : undefined;
              return next;
            }),
          })),
        })),
      deleteTask: (projectId, taskId) =>
        set((s) => ({
          projects: withProject(s.projects, projectId, (p) => ({ ...p, tasks: p.tasks.filter((t) => t.id !== taskId) })),
        })),
      dragTask: (projectId, activeId, over) =>
        set((s) => ({
          projects: withProject(s.projects, projectId, (p) => ({ ...p, tasks: moveTask(p.tasks, activeId, over) })),
        })),
      setColumns: (projectId, columns) =>
        set((s) => ({ projects: withProject(s.projects, projectId, (p) => ({ ...p, columns })) })),
      importProjects: (data) => {
        const parsed = z.object({ projects: z.array(projectSchema).min(1) }).safeParse(data);
        if (!parsed.success) return { ok: false, error: "This file is not a valid StudioFlow backup." };
        const existing = new Set(get().projects.map((p) => p.id));
        // Imported projects never overwrite existing ones: clashing ids get a fresh id
        const incoming = parsed.data.projects.map((p) => (existing.has(p.id) ? { ...p, id: uid("p") } : p));
        set((s) => ({ projects: [...s.projects, ...incoming], activeId: incoming[0].id }));
        return { ok: true, count: incoming.length };
      },
      resetDemo: () => set({ projects: sampleProjects(), activeId: "p-website" }),
    }),
    { name: "studioflow", version: 1 }
  )
);
