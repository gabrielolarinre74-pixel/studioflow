import { useMemo } from "react";
import { SortableContext, useSortable } from "@dnd-kit/sortable";
import { useDndContext } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { cva } from "class-variance-authority";
import { GripVertical, Inbox, Plus } from "lucide-react";
import type { Column, Task } from "@/lib/types";
import { TaskCard } from "./TaskCard";
import { Button } from "./ui/button";
import { ScrollArea, ScrollBar } from "./ui/scroll-area";

export type ColumnDragData = { type: "Column"; column: Column };

const COLUMN_ACCENT: Record<string, string> = {
  todo: "bg-slate-400",
  "in-progress": "bg-blue-600",
  review: "bg-sky-400",
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
    "flex h-[calc(100vh-17rem)] min-h-[440px] w-[290px] min-w-[270px] shrink-0 snap-center xl:w-auto xl:flex-1 flex-col rounded-2xl bg-slate-100/80 dark:bg-white/[0.03]",
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
      <header className="flex items-center gap-2 px-3 pb-2 pt-3">
        <button
          {...attributes}
          {...listeners}
          className="-ml-1 cursor-grab rounded p-0.5 text-muted-foreground/50 hover:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span className="sr-only">{`Move column: ${column.title}`}</span>
          <GripVertical className="size-4" />
        </button>
        <span className={`size-2 rounded-full ${COLUMN_ACCENT[column.id] ?? "bg-primary"}`} />
        <h3 className="text-[13px] font-bold">{column.title}</h3>
        <span className="rounded-full bg-card px-2 py-0.5 text-xs font-semibold tabular-nums text-muted-foreground shadow-xs">{tasks.length}</span>
        {onAdd && (
          <Button
            variant="ghost"
            size="icon"
            className="ml-auto size-7 rounded-lg hover:bg-card"
            onClick={() => onAdd(String(column.id))}
            aria-label={`Add task to ${column.title}`}
          >
            <Plus />
          </Button>
        )}
      </header>
      <ScrollArea className="flex-1">
        <div className="flex flex-col gap-2.5 p-2.5 pt-1">
          <SortableContext items={tasksIds}>
            {tasks.map((task) => (
              <TaskCard key={task.id} task={task} onOpen={onOpen} />
            ))}
          </SortableContext>
          {tasks.length === 0 && (
            <div className="flex flex-col items-center gap-2 rounded-xl border-2 border-dashed border-slate-200 px-4 py-8 text-center dark:border-white/10">
              <Inbox className="size-5 text-muted-foreground/60" />
              <p className="text-xs font-medium text-muted-foreground">Nothing here yet</p>
              <p className="text-[11px] text-muted-foreground/80">Drag a task in, or press + to add one.</p>
            </div>
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
