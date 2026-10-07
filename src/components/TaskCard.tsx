import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cva } from "class-variance-authority";
import { CalendarDays, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDay, isOverdue } from "@/lib/board";
import type { Task } from "@/lib/types";
import { Badge } from "./ui/badge";

export type TaskDragData = { type: "Task"; task: Task };

const PRIORITY_STYLE: Record<Task["priority"], string> = {
  high: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
  medium: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  low: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
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
    "group rounded-lg border bg-card text-card-foreground shadow-xs transition-shadow hover:shadow-md",
    {
      variants: {
        dragging: { over: "opacity-30 ring-2 ring-primary", overlay: "rotate-2 ring-2 ring-primary shadow-xl" },
      },
    }
  );
  const overdue = isOverdue(task);

  return (
    <div
      ref={setNodeRef}
      style={{ transition, transform: CSS.Translate.toString(transform) }}
      className={variants({ dragging: isOverlay ? "overlay" : isDragging ? "over" : undefined })}
    >
      <div className="flex items-start gap-1 p-3">
        {!readOnly && (
          <button
            {...attributes}
            {...listeners}
            className="-ml-1 mt-0.5 cursor-grab rounded p-0.5 text-muted-foreground/50 hover:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:cursor-grabbing"
          >
            <span className="sr-only">Move task: {task.title}</span>
            <GripVertical className="size-4" />
          </button>
        )}
        <button
          type="button"
          disabled={readOnly || !onOpen}
          onClick={() => onOpen?.(task)}
          className="min-w-0 flex-1 text-left focus-visible:outline-none disabled:cursor-default"
        >
          <p className="text-sm font-medium leading-snug">{task.title}</p>
          {task.description && <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{task.description}</p>}
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            <Badge variant="outline" className="text-[11px] font-medium">
              {task.tag}
            </Badge>
            <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-medium capitalize", PRIORITY_STYLE[task.priority])}>
              {task.priority}
            </span>
            {task.due && (
              <span
                className={cn(
                  "inline-flex items-center gap-1 text-[11px] text-muted-foreground",
                  overdue && "font-semibold text-rose-600 dark:text-rose-400"
                )}
              >
                <CalendarDays className="size-3" />
                {overdue ? "Overdue " : ""}
                {formatDay(task.due)}
              </span>
            )}
            <span
              title={task.owner === "client" ? "Waiting on the client" : "Studio is on it"}
              className={cn(
                "ml-auto flex size-6 items-center justify-center rounded-full text-[10px] font-bold",
                task.owner === "client" ? "bg-sky-500/15 text-sky-700 dark:text-sky-300" : "bg-primary/15 text-primary"
              )}
            >
              {task.owner === "client" ? "CL" : "ST"}
            </span>
          </div>
        </button>
      </div>
    </div>
  );
}
