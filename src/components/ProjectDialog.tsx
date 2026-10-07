import { useState } from "react";
import { toast } from "sonner";
import { useStore, type ProjectInput } from "@/lib/store";
import type { Project } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";

const COLORS = ["#7c3aed", "#0ea5e9", "#f97316", "#10b981", "#e11d48", "#eab308"];

type Props = { open: boolean; onOpenChange: (o: boolean) => void; project?: Project | null };

export function ProjectDialog({ open, onOpenChange, project }: Props) {
  const addProject = useStore((s) => s.addProject);
  const updateProject = useStore((s) => s.updateProject);
  const deleteProject = useStore((s) => s.deleteProject);
  // The parent remounts this dialog (via key) each time it opens, so state starts fresh
  const [form, setForm] = useState<ProjectInput>(() =>
    project
      ? { name: project.name, client: project.client, description: project.description, color: project.color, dueDate: project.dueDate ?? "" }
      : { name: "", client: "", description: "", color: COLORS[0], dueDate: "" }
  );
  const [errors, setErrors] = useState<Partial<Record<keyof ProjectInput, string>>>({});

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const next: typeof errors = {};
    if (form.name.trim().length < 2) next.name = "Project name is too short";
    if (form.client.trim().length < 2) next.client = "Client name is too short";
    setErrors(next);
    if (Object.keys(next).length) return;
    const clean = { ...form, name: form.name.trim(), client: form.client.trim(), dueDate: form.dueDate || undefined };
    if (project) {
      updateProject(project.id, clean);
      toast.success("Project updated");
    } else {
      addProject(clean);
      toast.success(`${clean.name} created`);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{project ? "Project settings" : "New client project"}</DialogTitle>
          <DialogDescription>Projects start with To do, In progress, Client review and Done columns.</DialogDescription>
        </DialogHeader>
        <form id="project-form" onSubmit={submit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="p-name">Project name</Label>
            <Input id="p-name" value={form.name} aria-invalid={!!errors.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Website redesign" />
            {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="p-client">Client</Label>
            <Input id="p-client" value={form.client} aria-invalid={!!errors.client} onChange={(e) => setForm({ ...form, client: e.target.value })} placeholder="Business name" />
            {errors.client && <p className="text-sm text-destructive">{errors.client}</p>}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="p-desc">Scope</Label>
            <Textarea id="p-desc" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="One or two lines your client will see on their status page" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="p-due">Deadline</Label>
              <Input id="p-due" type="date" value={form.dueDate ?? ""} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label>Colour</Label>
              <div className="flex h-10 items-center gap-2">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    aria-label={`Colour ${c}`}
                    onClick={() => setForm({ ...form, color: c })}
                    className={cn("size-6 rounded-full ring-offset-2 ring-offset-background", form.color === c && "ring-2 ring-foreground")}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          </div>
        </form>
        <DialogFooter className="sm:justify-between">
          {project ? (
            <Button
              variant="ghost"
              className="text-destructive"
              onClick={() => {
                if (!window.confirm(`Delete "${project.name}" and all its tasks?`)) return;
                deleteProject(project.id);
                toast("Project deleted");
                onOpenChange(false);
              }}
            >
              Delete project
            </Button>
          ) : (
            <span />
          )}
          <Button type="submit" form="project-form">{project ? "Save" : "Create project"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
