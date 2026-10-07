import { useMemo } from "react";
import { SortableContext, useSortable } from "@dnd-kit/sortable";
import { useDndContext } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { cva } from "class-variance-authority";
import { GripVertical, Plus } from "lucide-react";
import type { Column, Task } from "@/lib/types";
import { TaskCard } from "./TaskCard";
import { Button } from "./ui/button";
import { ScrollArea, ScrollBar } from "./ui/scroll-area";

export type ColumnDragData = { type: "Column"; column: Column };

const COLUMN_ACCENT: Record<string, string> = {
  todo: "bg-slate-400",
  "in-progress": "bg-amber-500",
  review: "bg-sky-500",
  done: "bg-emerald-500",
};

type Props = {
  column: Column;
  tasks: Task[];
  isOverlay?: boolean;
  onAdd?: (columnId: string) => void;
  onOpen?: (task: Task) => void;
};

export function BoardColumn({ column, tasks, isOverlay, onAdd, onOpen }: Props) {
  const tasksIds = useMemo(() => tasks.map((t) => t.id), [tasks]);
  const { setNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({
    id: column.id,
    data: { type: "Column", column } satisfies ColumnDragData,
    attributes: { roleDescription: `Column: ${column.title}` },
  });

  const variants = cva(
    "flex h-[calc(100vh-17rem)] min-h-[420px] w-[280px] min-w-[260px] shrink-0 snap-center xl:w-auto xl:flex-1 flex-col rounded-xl border bg-muted/40",
    {
      variants: {
        dragging: { default: "", over: "opacity-30 ring-2", overlay: "ring-2 ring-primary" },
      },
    }
  );

  return (
    <section
      ref={setNodeRef}
      aria-label={column.title}
      style={{ transition, transform: CSS.Translate.toString(transform) }}
      className={variants({ dragging: isOverlay ? "overlay" : isDragging ? "over" : "default" })}
    >
      <header className="flex items-center gap-2 border-b px-3 py-2.5">
        <button
          {...attributes}
          {...listeners}
          className="-ml-1 cursor-grab rounded p-0.5 text-muted-foreground/50 hover:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span className="sr-only">{`Move column: ${column.title}`}</span>
          <GripVertical className="size-4" />
        </button>
        <span className={`size-2 rounded-full ${COLUMN_ACCENT[column.id] ?? "bg-primary"}`} />
        <h3 className="text-sm font-semibold">{column.title}</h3>
        <span className="rounded-full bg-background px-2 py-0.5 text-xs text-muted-foreground">{tasks.length}</span>
        {onAdd && (
          <Button
            variant="ghost"
            size="icon"
            className="ml-auto size-7"
            onClick={() => onAdd(String(column.id))}
            aria-label={`Add task to ${column.title}`}
          >
            <Plus />
          </Button>
        )}
      </header>
      <ScrollArea className="flex-1">
        <div className="flex flex-col gap-2 p-2">
          <SortableContext items={tasksIds}>
            {tasks.map((task) => (
              <TaskCard key={task.id} task={task} onOpen={onOpen} />
            ))}
          </SortableContext>
          {tasks.length === 0 && (
            <p className="rounded-lg border border-dashed p-6 text-center text-xs text-muted-foreground">Drop tasks here</p>
          )}
        </div>
      </ScrollArea>
    </section>
  );
}

export function BoardContainer({ children }: { children: React.ReactNode }) {
  const dndContext = useDndContext();
  return (
    <ScrollArea className={dndContext.active ? "snap-none pb-4" : "snap-x snap-mandatory pb-4"}>
      <div className="flex flex-row items-start gap-4">{children}</div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}
