import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cva } from "class-variance-authority";
import { CalendarDays, Flag, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDay, isOverdue } from "@/lib/board";
import type { Task } from "@/lib/types";

export type TaskDragData = { type: "Task"; task: Task };

const PRIORITY: Record<Task["priority"], { label: string; className: string }> = {
  high: { label: "High", className: "text-red-600 dark:text-red-400" },
  medium: { label: "Medium", className: "text-amber-600 dark:text-amber-400" },
  low: { label: "Low", className: "text-slate-400" },
};

type Props = { task: Task; isOverlay?: boolean; readOnly?: boolean; onOpen?: (task: Task) => void };

export function TaskCard({ task, isOverlay, readOnly, onOpen }: Props) {
  const { setNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { type: "Task", task } satisfies TaskDragData,
    attributes: { roleDescription: "Task" },
    disabled: readOnly,
  });

  const variants = cva(
    "group relative rounded-xl border bg-card text-card-foreground shadow-[0_1px_2px_rgb(15_23_42/0.05)] transition hover:-translate-y-px hover:border-blue-300 hover:shadow-[0_10px_24px_-12px_rgb(15_23_42/0.25)] dark:hover:border-blue-700",
    {
      variants: {
        dragging: { over: "opacity-30 ring-2 ring-primary", overlay: "rotate-2 ring-2 ring-primary shadow-xl" },
      },
    }
  );
  const overdue = isOverdue(task);
  const priority = PRIORITY[task.priority];

  return (
    <div
      ref={setNodeRef}
      style={{ transition, transform: CSS.Translate.toString(transform) }}
      className={variants({ dragging: isOverlay ? "overlay" : isDragging ? "over" : undefined })}
    >
      {!readOnly && (
        <button
          {...attributes}
          {...listeners}
          className="absolute right-2 top-2 cursor-grab rounded-md p-1 text-muted-foreground/40 opacity-60 transition hover:bg-muted hover:text-muted-foreground focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:cursor-grabbing group-hover:opacity-100"
        >
          <span className="sr-only">Move task: {task.title}</span>
          <GripVertical className="size-4" />
        </button>
      )}
      <button
        type="button"
        disabled={readOnly || !onOpen}
        onClick={() => onOpen?.(task)}
        className="block w-full p-3.5 text-left focus-visible:outline-none disabled:cursor-default"
      >
        <div className="flex items-center gap-2 pr-6 text-[11px] font-semibold">
          <span className="rounded-md bg-accent px-1.5 py-0.5 text-accent-foreground">{task.tag}</span>
          <span className={cn("inline-flex items-center gap-1", priority.className)} title={`${priority.label} priority`}>
            <Flag className="size-3" fill="currentColor" /> {priority.label}
          </span>
        </div>
        <p className="mt-2.5 text-[14px] font-semibold leading-snug">{task.title}</p>
        {task.description && <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">{task.description}</p>}
        <div className="mt-3.5 flex items-center gap-2 border-t pt-3">
          {task.due ? (
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground",
                overdue && "bg-red-500/10 font-semibold text-red-600 dark:text-red-400"
              )}
            >
              <CalendarDays className="size-3" />
              {overdue ? "Overdue · " : ""}
              {formatDay(task.due)}
            </span>
          ) : (
            <span className="text-[11px] text-muted-foreground/70">No due date</span>
          )}
          <span
            title={task.owner === "client" ? "Waiting on the client" : "Our team is on it"}
            className={cn(
              "ml-auto flex h-6 items-center gap-1 rounded-full px-2 text-[10px] font-bold uppercase tracking-wide",
              task.owner === "client" ? "bg-sky-500/15 text-sky-700 dark:text-sky-300" : "bg-foreground text-background"
            )}
          >
            {task.owner === "client" ? "Client" : "Team"}
          </span>
        </div>
      </button>
    </div>
  );
}
