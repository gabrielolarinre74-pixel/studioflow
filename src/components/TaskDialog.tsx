import { useState } from "react";
import { toast } from "sonner";
import { useStore, type TaskInput } from "@/lib/store";
import { OWNERS, PRIORITIES, TAGS, type Project, type Task } from "@/lib/types";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Textarea } from "./ui/textarea";

type Props = {
  project: Project;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: Task | null;
  columnId?: string;
};

const blank = (columnId: string): TaskInput => ({
  columnId,
  title: "",
  description: "",
  priority: "medium",
  owner: "studio",
  tag: "Development",
  due: "",
});

export function TaskDialog({ project, open, onOpenChange, task, columnId = "todo" }: Props) {
  const addTask = useStore((s) => s.addTask);
  const updateTask = useStore((s) => s.updateTask);
  const deleteTask = useStore((s) => s.deleteTask);
  // The parent remounts this dialog (via key) each time it opens, so state starts fresh
  const [form, setForm] = useState<TaskInput>(() => (task ? { ...task, due: task.due ?? "" } : blank(columnId)));
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof TaskInput>(key: K, value: TaskInput[K]) => setForm((f) => ({ ...f, [key]: value }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const title = form.title.trim();
    if (title.length < 2) return setError("Give the task a short title (at least 2 characters).");
    if (title.length > 120) return setError("Keep the title under 120 characters.");
    const clean = { ...form, title, due: form.due || undefined };
    if (task) {
      updateTask(project.id, task.id, clean);
      toast.success("Task updated");
    } else {
      addTask(project.id, clean);
      toast.success("Task added");
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{task ? "Edit task" : "New task"}</DialogTitle>
          <DialogDescription>
            {project.name} · {project.client}
          </DialogDescription>
        </DialogHeader>
        <form id="task-form" onSubmit={submit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="task-title">Title</Label>
            <Input
              id="task-title"
              autoFocus
              value={form.title}
              aria-invalid={!!error}
              onChange={(e) => set("title", e.target.value)}
              placeholder="e.g. Approve homepage design"
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="task-desc">Details</Label>
            <Textarea id="task-desc" value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="Links, acceptance criteria, notes for the client…" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Status">
              <Select value={form.columnId} onValueChange={(v) => set("columnId", v)}>
                <SelectTrigger aria-label="Status"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {project.columns.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Waiting on">
              <Select value={form.owner} onValueChange={(v) => set("owner", v as Task["owner"])}>
                <SelectTrigger aria-label="Waiting on"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {OWNERS.map((o) => (
                    <SelectItem key={o} value={o}>{o === "studio" ? "Studio (us)" : "Client"}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Priority">
              <Select value={form.priority} onValueChange={(v) => set("priority", v as Task["priority"])}>
                <SelectTrigger aria-label="Priority"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((p) => (
                    <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Type">
              <Select value={form.tag} onValueChange={(v) => set("tag", v as Task["tag"])}>
                <SelectTrigger aria-label="Type"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TAGS.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <div className="col-span-2 grid gap-2">
              <Label htmlFor="task-due">Due date</Label>
              <Input id="task-due" type="date" value={form.due ?? ""} onChange={(e) => set("due", e.target.value)} />
            </div>
          </div>
        </form>
        <DialogFooter className="sm:justify-between">
          {task ? (
            <Button
              variant="ghost"
              className="text-destructive"
              onClick={() => {
                deleteTask(project.id, task.id);
                toast("Task deleted");
                onOpenChange(false);
              }}
            >
              Delete
            </Button>
          ) : (
            <span />
          )}
          <Button type="submit" form="task-form">{task ? "Save changes" : "Add task"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
