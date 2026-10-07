import { z } from "zod";

export const PRIORITIES = ["low", "medium", "high"] as const;
export const OWNERS = ["studio", "client"] as const;
export const TAGS = ["Design", "Development", "Content", "SEO", "Launch", "Automation"] as const;

export const columnSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1).max(40),
});
export type Column = z.infer<typeof columnSchema>;

export const taskSchema = z.object({
  id: z.string().min(1),
  columnId: z.string().min(1),
  title: z.string().trim().min(2, "Give the task a short title").max(120),
  description: z.string().max(2000).default(""),
  priority: z.enum(PRIORITIES),
  owner: z.enum(OWNERS),
  tag: z.enum(TAGS),
  due: z.string().optional(),
  createdAt: z.string(),
  completedAt: z.string().optional(),
});
export type Task = z.infer<typeof taskSchema>;

export const projectSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(2, "Project name is too short").max(80),
  client: z.string().trim().min(2, "Client name is too short").max(80),
  description: z.string().max(500).default(""),
  color: z.string().regex(/^#[0-9a-f]{6}$/i),
  startDate: z.string(),
  dueDate: z.string().optional(),
  columns: z.array(columnSchema).min(1),
  tasks: z.array(taskSchema),
});
export type Project = z.infer<typeof projectSchema>;

export const DEFAULT_COLUMNS: Column[] = [
  { id: "todo", title: "To do" },
  { id: "in-progress", title: "In progress" },
  { id: "review", title: "Client review" },
  { id: "done", title: "Done" },
];

export const DONE_COLUMN = "done";
export const REVIEW_COLUMN = "review";
