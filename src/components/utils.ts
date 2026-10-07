import type { Active, DataRef, Over } from "@dnd-kit/core";
import type { ColumnDragData } from "./BoardColumn";
import type { TaskDragData } from "./TaskCard";

type DraggableData = ColumnDragData | TaskDragData;

export function hasDraggableData<T extends Active | Over>(
  entry: T | null | undefined
): entry is T & { data: DataRef<DraggableData> } {
  const type = entry?.data.current?.type;
  return type === "Column" || type === "Task";
}
