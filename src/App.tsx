import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, CalendarClock, Download, FolderPlus, Hourglass, Link2, MoreHorizontal, Plus, RotateCcw, Search, Settings2, Upload } from "lucide-react";
import { Toaster, toast } from "sonner";
import { KanbanBoard } from "./components/KanbanBoard";
import { Logo } from "./components/Logo";
import { ProgressRing } from "./components/ProgressRing";
import { ProjectDialog } from "./components/ProjectDialog";
import { ShareView } from "./components/ShareView";
import { TaskDialog } from "./components/TaskDialog";
import { ThemeToggle } from "./components/ThemeToggle";
import { ThemeProvider, useTheme } from "./components/theme-provider";
import { Button } from "./components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "./components/ui/dropdown-menu";
import { Input } from "./components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./components/ui/select";
import { filterTasks, formatDay, projectStats, type TaskFilter } from "./lib/board";
import { decodeSnapshot, readShareHash, shareUrl } from "./lib/share";
import { useStore } from "./lib/store";
import type { Task } from "./lib/types";
import { cn } from "./lib/utils";

function useHash() {
  const [hash, setHash] = useState(() => window.location.hash);
  useEffect(() => {
    const onChange = () => setHash(window.location.hash);
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);
  return hash;
}

export default function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="studioflow-theme">
      <Root />
    </ThemeProvider>
  );
}

function Root() {
  const hash = useHash();
  const { theme } = useTheme();
  const encoded = readShareHash(hash);
  const snapshot = useMemo(() => (encoded ? decodeSnapshot(encoded) : null), [encoded]);
  const toaster = <Toaster richColors position="bottom-right" theme={theme === "dark" ? "dark" : "light"} />;

  if (encoded) {
    return (
      <>
        {snapshot ? (
          <ShareView snapshot={snapshot} />
        ) : (
          <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
            <AlertTriangle className="size-10 text-amber-500" />
            <h1 className="text-xl font-semibold">This status link is broken or incomplete</h1>
            <p className="max-w-md text-muted-foreground">Make sure you copied the whole link, or ask your project lead to send a new one.</p>
          </div>
        )}
        {toaster}
      </>
    );
  }
  return (
    <>
      <Workspace />
      {toaster}
    </>
  );
}

function Workspace() {
  const projects = useStore((s) => s.projects);
  const activeId = useStore((s) => s.activeId);
  const setActive = useStore((s) => s.setActive);
  const importProjects = useStore((s) => s.importProjects);
  const resetDemo = useStore((s) => s.resetDemo);
  const project = projects.find((p) => p.id === activeId) ?? projects[0];
  const [filter, setFilter] = useState<TaskFilter>({ query: "", priority: "all", owner: "all" });
  const [taskDialog, setTaskDialogState] = useState<{ open: boolean; task?: Task | null; columnId?: string; n: number }>({ open: false, n: 0 });
  const setTaskDialog = (d: { open: boolean; task?: Task | null; columnId?: string }) => setTaskDialogState((prev) => ({ ...d, n: prev.n + 1 }));
  const [projectDialog, setProjectDialogState] = useState<{ open: boolean; edit: boolean; n: number }>({ open: false, edit: false, n: 0 });
  const setProjectDialog = (d: { open: boolean; edit: boolean }) => setProjectDialogState((prev) => ({ ...d, n: prev.n + 1 }));
  const fileRef = useRef<HTMLInputElement>(null);

  const visibleTasks = useMemo(() => (project ? filterTasks(project.tasks, filter) : []), [project, filter]);
  const stats = project ? projectStats(project) : null;
  const filtered = filter.query !== "" || filter.priority !== "all" || filter.owner !== "all";

  const copyShareLink = async () => {
    if (!project) return;
    const url = shareUrl(project);
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Client status link copied", { description: "It shows a read-only snapshot of this project as it is now." });
    } catch {
      window.prompt("Copy this link and send it to your client:", url);
    }
  };

  const exportJson = () => {
    const blob = new Blob([JSON.stringify({ app: "studioflow", version: 1, projects }, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `studioflow-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    toast.success("Backup downloaded");
  };

  const importJson = async (file: File) => {
    if (file.size > 2_000_000) return toast.error("That file is too large to be a StudioFlow backup.");
    try {
      const result = importProjects(JSON.parse(await file.text()));
      if (result.ok) toast.success(`Imported ${result.count} project${result.count === 1 ? "" : "s"}`);
      else toast.error(result.error);
    } catch {
      toast.error("Could not read that file. Is it a JSON backup?");
    }
  };

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-72 shrink-0 flex-col border-r bg-background lg:flex">
        <div className="border-b px-5 py-4">
          <Logo />
        </div>
        <div className="flex items-center justify-between px-5 pb-2 pt-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Client projects</p>
          <Button variant="ghost" size="icon" className="size-7" aria-label="New project" onClick={() => setProjectDialog({ open: true, edit: false })}>
            <FolderPlus />
          </Button>
        </div>
        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 pb-4">
          {projects.map((p) => {
            const s = projectStats(p);
            return (
              <button
                key={p.id}
                onClick={() => setActive(p.id)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-muted",
                  p.id === project?.id && "bg-accent text-accent-foreground hover:bg-accent"
                )}
              >
                <ProgressRing value={s.progress} color={p.color} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{p.name}</span>
                  <span className="block truncate text-xs text-muted-foreground">{p.client}</span>
                </span>
                {s.overdue > 0 && <span className="rounded-full bg-rose-500/15 px-1.5 text-[11px] font-semibold text-rose-600">{s.overdue}</span>}
              </button>
            );
          })}
        </nav>
        <div className="border-t p-4 text-xs text-muted-foreground">Data is saved in this browser. Use Export to back it up.</div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-3 border-b bg-background px-4 py-3 lg:px-6">
          <div className="lg:hidden">
            <Logo subtitle={false} />
          </div>
          <div className="min-w-0 flex-1 lg:hidden">
            <Select value={project?.id} onValueChange={setActive}>
              <SelectTrigger aria-label="Project"><SelectValue /></SelectTrigger>
              <SelectContent>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="relative hidden max-w-sm flex-1 lg:block">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search tasks…"
              value={filter.query}
              onChange={(e) => setFilter({ ...filter, query: e.target.value })}
            />
          </div>
          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" aria-label="More actions"><MoreHorizontal /></Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuItem onClick={() => setProjectDialog({ open: true, edit: false })}><FolderPlus className="mr-2 size-4" /> New project</DropdownMenuItem>
                <DropdownMenuItem onClick={exportJson}><Download className="mr-2 size-4" /> Export backup (JSON)</DropdownMenuItem>
                <DropdownMenuItem onClick={() => fileRef.current?.click()}><Upload className="mr-2 size-4" /> Import backup</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    if (window.confirm("Replace everything with the sample projects?")) {
                      resetDemo();
                      toast.success("Sample projects restored");
                    }
                  }}
                >
                  <RotateCcw className="mr-2 size-4" /> Reset demo data
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) importJson(f);
                e.target.value = "";
              }}
            />
          </div>
        </header>

        {project && stats ? (
          <main className="flex flex-1 flex-col gap-5 p-4 lg:p-6">
            <section className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="size-2.5 rounded-full" style={{ backgroundColor: project.color }} />
                  {project.client}
                </div>
                <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">{project.name}</h1>
                {project.description && <p className="mt-1 max-w-2xl text-muted-foreground">{project.description}</p>}
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={() => setProjectDialog({ open: true, edit: true })}>
                  <Settings2 /> Settings
                </Button>
                <Button variant="outline" onClick={copyShareLink}>
                  <Link2 /> Share with client
                </Button>
                <Button onClick={() => setTaskDialog({ open: true, columnId: "todo" })}>
                  <Plus /> New task
                </Button>
              </div>
            </section>

            <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <StatCard label="Progress" value={`${Math.round(stats.progress * 100)}%`} sub={`${stats.done} of ${stats.total} tasks done`}>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full transition-all" style={{ width: `${stats.progress * 100}%`, backgroundColor: project.color }} />
                </div>
              </StatCard>
              <StatCard label="Waiting on client" value={String(stats.awaitingClient)} sub="In review or client-owned" icon={<Hourglass className="size-4 text-sky-500" />} />
              <StatCard label="Overdue" value={String(stats.overdue)} sub={stats.overdue ? "Needs attention" : "All on schedule"} icon={<AlertTriangle className={cn("size-4", stats.overdue ? "text-rose-500" : "text-muted-foreground")} />} />
              <StatCard
                label="Deadline"
                value={stats.daysLeft === undefined ? "–" : stats.daysLeft >= 0 ? `${stats.daysLeft} days` : `${-stats.daysLeft}d late`}
                sub={project.dueDate ? formatDay(project.dueDate, { day: "numeric", month: "long" }) : "No deadline set"}
                icon={<CalendarClock className="size-4 text-amber-500" />}
              />
            </section>

            <section className="flex flex-wrap items-center gap-2">
              <div className="relative w-full sm:w-64 lg:hidden">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input className="pl-9" placeholder="Search tasks…" value={filter.query} onChange={(e) => setFilter({ ...filter, query: e.target.value })} />
              </div>
              <Select value={filter.priority} onValueChange={(v) => setFilter({ ...filter, priority: v as TaskFilter["priority"] })}>
                <SelectTrigger className="w-40" aria-label="Filter by priority"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All priorities</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filter.owner} onValueChange={(v) => setFilter({ ...filter, owner: v as TaskFilter["owner"] })}>
                <SelectTrigger className="w-44" aria-label="Filter by owner"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Everyone</SelectItem>
                  <SelectItem value="studio">Waiting on studio</SelectItem>
                  <SelectItem value="client">Waiting on client</SelectItem>
                </SelectContent>
              </Select>
              {filtered && (
                <Button variant="ghost" size="sm" onClick={() => setFilter({ query: "", priority: "all", owner: "all" })}>
                  Clear filters · {visibleTasks.length} shown
                </Button>
              )}
            </section>

            <KanbanBoard
              project={project}
              visibleTasks={visibleTasks}
              onAdd={(columnId) => setTaskDialog({ open: true, columnId })}
              onOpen={(task) => setTaskDialog({ open: true, task })}
            />
          </main>
        ) : (
          <main className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
            <h1 className="text-xl font-semibold">No projects yet</h1>
            <Button onClick={() => setProjectDialog({ open: true, edit: false })}><FolderPlus /> Create your first project</Button>
          </main>
        )}
      </div>

      {project && (
        <TaskDialog
          key={`task-${taskDialog.n}`}
          project={project}
          open={taskDialog.open}
          task={taskDialog.task}
          columnId={taskDialog.columnId}
          onOpenChange={(open) => setTaskDialogState((d) => ({ ...d, open }))}
        />
      )}
      <ProjectDialog
        key={`project-${projectDialog.n}`}
        open={projectDialog.open}
        project={projectDialog.edit ? project : null}
        onOpenChange={(open) => setProjectDialogState((d) => ({ ...d, open }))}
      />
    </div>
  );
}

function StatCard({ label, value, sub, icon, children }: { label: string; value: string; sub: string; icon?: React.ReactNode; children?: React.ReactNode }) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
        {label}
        {icon}
      </div>
      <p className="mt-1 text-2xl font-bold tabular-nums">{value}</p>
      <p className="text-xs text-muted-foreground">{sub}</p>
      {children}
    </div>
  );
}
