import { useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  type Announcements,
  DndContext,
  type DragEndEvent,
  type DragOverEvent,
  DragOverlay,
  type DragStartEvent,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  type UniqueIdentifier,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { SortableContext, arrayMove } from "@dnd-kit/sortable";
import { useStore } from "@/lib/store";
import type { Column, Project, Task } from "@/lib/types";
import { BoardColumn, BoardContainer } from "./BoardColumn";
import { TaskCard } from "./TaskCard";
import { coordinateGetter } from "./multipleContainersKeyboardPreset";
import { hasDraggableData } from "./utils";

type Props = {
  project: Project;
  visibleTasks: Task[];
  onAdd: (columnId: string) => void;
  onOpen: (task: Task) => void;
};

export function KanbanBoard({ project, visibleTasks, onAdd, onOpen }: Props) {
  const dragTask = useStore((s) => s.dragTask);
  const setColumns = useStore((s) => s.setColumns);
  const columns = project.columns;
  const pickedUpTaskColumn = useRef<string | null>(null);
  const columnsId = useMemo(() => columns.map((c) => c.id), [columns]);
  const [activeColumn, setActiveColumn] = useState<Column | null>(null);
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const sensors = useSensors(
    // A small distance stops clicks on the grip from starting a drag
    useSensor(MouseSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter })
  );

  function getDraggingTaskData(taskId: UniqueIdentifier, columnId: string) {
    const tasksInColumn = project.tasks.filter((t) => t.columnId === columnId);
    return {
      tasksInColumn,
      taskPosition: tasksInColumn.findIndex((t) => t.id === taskId),
      column: columns.find((c) => c.id === columnId),
    };
  }

  // Screen reader announcements for every drag interaction
  const announcements: Announcements = {
    onDragStart({ active }) {
      if (!hasDraggableData(active)) return;
      if (active.data.current?.type === "Column") {
        const pos = columnsId.findIndex((id) => id === active.id);
        return `Picked up column ${active.data.current.column.title} at position ${pos + 1} of ${columnsId.length}`;
      }
      if (active.data.current?.type === "Task") {
        pickedUpTaskColumn.current = active.data.current.task.columnId;
        const { tasksInColumn, taskPosition, column } = getDraggingTaskData(active.id, pickedUpTaskColumn.current);
        return `Picked up task ${active.data.current.task.title} at position ${taskPosition + 1} of ${tasksInColumn.length} in ${column?.title}`;
      }
    },
    onDragOver({ active, over }) {
      if (!hasDraggableData(active) || !hasDraggableData(over)) return;
      if (active.data.current?.type === "Column" && over.data.current?.type === "Column") {
        const pos = columnsId.findIndex((id) => id === over.id);
        return `Column ${active.data.current.column.title} was moved over ${over.data.current.column.title} at position ${pos + 1} of ${columnsId.length}`;
      }
      if (active.data.current?.type === "Task" && over.data.current?.type === "Task") {
        const { tasksInColumn, taskPosition, column } = getDraggingTaskData(over.id, over.data.current.task.columnId);
        return `Task moved to position ${taskPosition + 1} of ${tasksInColumn.length} in ${column?.title}`;
      }
    },
    onDragEnd({ active, over }) {
      if (!hasDraggableData(active) || !hasDraggableData(over)) {
        pickedUpTaskColumn.current = null;
        return;
      }
      if (active.data.current?.type === "Column" && over.data.current?.type === "Column") {
        const pos = columnsId.findIndex((id) => id === over.id);
        return `Column ${active.data.current.column.title} was dropped into position ${pos + 1} of ${columnsId.length}`;
      }
      if (active.data.current?.type === "Task" && over.data.current?.type === "Task") {
        const { tasksInColumn, taskPosition, column } = getDraggingTaskData(over.id, over.data.current.task.columnId);
        pickedUpTaskColumn.current = null;
        return `Task dropped into position ${taskPosition + 1} of ${tasksInColumn.length} in ${column?.title}`;
      }
      pickedUpTaskColumn.current = null;
    },
    onDragCancel({ active }) {
      pickedUpTaskColumn.current = null;
      if (!hasDraggableData(active)) return;
      return `Dragging ${active.data.current?.type} cancelled.`;
    },
  };

  function onDragStart(event: DragStartEvent) {
    if (!hasDraggableData(event.active)) return;
    const data = event.active.data.current;
    if (data?.type === "Column") setActiveColumn(data.column);
    if (data?.type === "Task") setActiveTask(data.task);
  }

  function onDragEnd(event: DragEndEvent) {
    setActiveColumn(null);
    setActiveTask(null);
    const { active, over } = event;
    if (!over || active.id === over.id || !hasDraggableData(active)) return;
    if (active.data.current?.type !== "Column") return;
    const from = columns.findIndex((c) => c.id === active.id);
    const to = columns.findIndex((c) => c.id === over.id);
    if (from !== -1 && to !== -1) setColumns(project.id, arrayMove(columns, from, to));
  }

  function onDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    if (!hasDraggableData(active) || !hasDraggableData(over)) return;
    if (active.data.current?.type !== "Task") return;
    const overType = over.data.current?.type;
    if (overType === "Task" || overType === "Column") {
      dragTask(project.id, String(active.id), { id: String(over.id), type: overType });
    }
  }

  return (
    <DndContext
      accessibility={{ announcements }}
      sensors={sensors}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragOver={onDragOver}
    >
      <BoardContainer>
        <SortableContext items={columnsId}>
          {columns.map((col) => (
            <BoardColumn
              key={col.id}
              column={col}
              tasks={visibleTasks.filter((t) => t.columnId === col.id)}
              onAdd={onAdd}
              onOpen={onOpen}
            />
          ))}
        </SortableContext>
      </BoardContainer>

      {"document" in window &&
        createPortal(
          <DragOverlay>
            {activeColumn && (
              <BoardColumn isOverlay column={activeColumn} tasks={visibleTasks.filter((t) => t.columnId === activeColumn.id)} />
            )}
            {activeTask && <TaskCard task={activeTask} isOverlay />}
          </DragOverlay>,
          document.body
        )}
    </DndContext>
  );
}
