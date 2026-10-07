import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, CalendarClock, Download, FolderPlus, Hourglass, Keyboard, Link2, MoreHorizontal, Plus, RotateCcw, Search, Settings2, Upload } from "lucide-react";
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
import { SHORTCUTS, shortcutFor } from "./lib/shortcuts";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./components/ui/dialog";
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
  const searchRef = useRef<HTMLInputElement>(null);
  const [helpOpen, setHelpOpen] = useState(false);

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

  // Single-key shortcuts (ignored while typing or when a dialog is open)
  const shortcutHandlers = useRef<Record<string, () => void>>({});
  useEffect(() => {
    shortcutHandlers.current = {
      "new-task": () => project && setTaskDialog({ open: true, columnId: "todo" }),
      search: () => searchRef.current?.focus(),
      share: () => void copyShareLink(),
      help: () => setHelpOpen((o) => !o),
    };
  });
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (document.querySelector('[role="dialog"]') && e.key !== "?") return;
      const action = shortcutFor(e);
      if (!action) return;
      e.preventDefault();
      shortcutHandlers.current[action]?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

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
    <div className="flex min-h-screen bg-background">
      <aside className="sticky top-0 hidden h-screen w-72 shrink-0 p-3 lg:block">
        <div className="flex h-full flex-col rounded-2xl border bg-card shadow-[0_1px_2px_rgb(15_23_42/0.04),0_12px_32px_-16px_rgb(15_23_42/0.18)]">
          <div className="px-5 pb-4 pt-5">
            <Logo />
          </div>
          <div className="mx-3 rounded-xl bg-muted/70 p-1">
            <button
              type="button"
              onClick={() => setProjectDialog({ open: true, edit: false })}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-foreground py-2 text-sm font-semibold text-background transition hover:opacity-90"
            >
              <FolderPlus className="size-4" /> New client project
            </button>
          </div>
          <p className="px-5 pb-2 pt-6 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Projects · {projects.length}</p>
          <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-3 pb-4" aria-label="Projects">
            {projects.map((p) => {
              const s = projectStats(p);
              const active = p.id === project?.id;
              return (
                <button
                  key={p.id}
                  onClick={() => setActive(p.id)}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "relative flex items-center gap-3 rounded-xl px-2.5 py-2.5 text-left transition-colors hover:bg-muted",
                    active && "bg-accent text-accent-foreground hover:bg-accent"
                  )}
                >
                  {active && <span className="absolute -left-3 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-primary" />}
                  <ProgressRing value={s.progress} color={p.color} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">{p.name}</span>
                    <span className="block truncate text-xs text-muted-foreground">{p.client}</span>
                  </span>
                  {s.overdue > 0 && (
                    <span className="rounded-full bg-red-500/10 px-1.5 text-[11px] font-semibold text-red-600" title={`${s.overdue} overdue`}>
                      {s.overdue}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
          <div className="m-3 rounded-xl border border-dashed p-3 text-xs leading-relaxed text-muted-foreground">
            Saved in this browser. Use <span className="font-semibold text-foreground">Export</span> in the menu to keep a backup.
            <button type="button" onClick={() => setHelpOpen(true)} className="mt-2 flex items-center gap-1.5 font-semibold text-primary hover:underline">
              <Keyboard className="size-3.5" /> Keyboard shortcuts
            </button>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b bg-background/80 px-4 py-3 backdrop-blur lg:border-none lg:bg-transparent lg:px-8 lg:pt-6 lg:backdrop-blur-none">
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
          {project && (
            <p className="hidden min-w-0 items-center gap-2 truncate text-sm text-muted-foreground lg:flex">
              <span>Projects</span>
              <span className="text-border">/</span>
              <span>{project.client}</span>
              <span className="text-border">/</span>
              <span className="truncate font-medium text-foreground">{project.name}</span>
            </p>
          )}
          <div className="ml-auto flex items-center gap-2">
            <div className="relative hidden w-72 lg:block">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                ref={searchRef}
                className="h-9 rounded-lg bg-card pl-9 pr-10"
                placeholder="Search tasks"
                value={filter.query}
                onChange={(e) => setFilter({ ...filter, query: e.target.value })}
              />
              <kbd className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 rounded border bg-muted px-1.5 text-[10px] font-semibold text-muted-foreground">/</kbd>
            </div>
            <ThemeToggle />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="bg-card" aria-label="More actions"><MoreHorizontal /></Button>
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
          <main className="flex flex-1 flex-col gap-6 p-4 lg:px-8 lg:pb-8 lg:pt-4">
            <section className="relative overflow-hidden rounded-2xl border bg-card shadow-[0_1px_2px_rgb(15_23_42/0.04),0_12px_32px_-16px_rgb(15_23_42/0.18)]">
              <div className="h-1.5 w-full bg-gradient-to-r from-blue-600 via-blue-500 to-sky-400" />
              <div className="flex flex-col gap-6 p-6 xl:flex-row xl:items-start xl:justify-between">
                <div className="min-w-0">
                  <span className="inline-flex items-center gap-2 rounded-full border bg-background px-2.5 py-1 text-xs font-medium text-muted-foreground">
                    <span className="size-2 rounded-full" style={{ backgroundColor: project.color }} />
                    {project.client}
                  </span>
                  <h1 className="mt-3 text-[28px] font-extrabold leading-tight tracking-tight sm:text-[32px]">{project.name}</h1>
                  {project.description && <p className="mt-1.5 max-w-2xl text-muted-foreground">{project.description}</p>}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" onClick={() => setProjectDialog({ open: true, edit: true })}>
                    <Settings2 /> Edit
                  </Button>
                  <Button variant="outline" onClick={copyShareLink}>
                    <Link2 /> Share with client
                  </Button>
                  <Button className="shadow-[0_8px_20px_-8px_rgb(37_99_235/0.7)]" onClick={() => setTaskDialog({ open: true, columnId: "todo" })}>
                    <Plus /> New task
                    <kbd className="ml-1 rounded bg-white/20 px-1.5 text-[10px] font-semibold">N</kbd>
                  </Button>
                </div>
              </div>
              <div className="grid border-t sm:grid-cols-2 xl:grid-cols-4">
                <Stat label="Progress" value={`${Math.round(stats.progress * 100)}%`} sub={`${stats.done} of ${stats.total} tasks done`}>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-gradient-to-r from-blue-600 to-sky-400 transition-all" style={{ width: `${stats.progress * 100}%` }} />
                  </div>
                </Stat>
                <Stat label="Waiting on client" value={String(stats.awaitingClient)} sub="In review or client-owned" icon={<Hourglass className="size-4 text-sky-500" />} />
                <Stat
                  label="Overdue"
                  value={String(stats.overdue)}
                  sub={stats.overdue ? "Needs attention" : "All on schedule"}
                  icon={<AlertTriangle className={cn("size-4", stats.overdue ? "text-red-500" : "text-muted-foreground")} />}
                  tone={stats.overdue ? "danger" : undefined}
                />
                <Stat
                  label="Deadline"
                  value={stats.daysLeft === undefined ? "–" : stats.daysLeft >= 0 ? `${stats.daysLeft} days` : `${-stats.daysLeft}d late`}
                  sub={project.dueDate ? formatDay(project.dueDate, { day: "numeric", month: "long" }) : "No deadline set"}
                  icon={<CalendarClock className="size-4 text-blue-500" />}
                />
              </div>
            </section>

            <section className="flex flex-wrap items-center gap-2">
              <div className="relative w-full sm:w-64 lg:hidden">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input className="bg-card pl-9" placeholder="Search tasks" value={filter.query} onChange={(e) => setFilter({ ...filter, query: e.target.value })} />
              </div>
              <div className="flex rounded-lg border bg-card p-0.5" role="group" aria-label="Filter by owner">
                {(["all", "studio", "client"] as const).map((o) => (
                  <button
                    key={o}
                    type="button"
                    aria-pressed={filter.owner === o}
                    onClick={() => setFilter({ ...filter, owner: o })}
                    className={cn(
                      "rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition",
                      filter.owner === o && "bg-foreground text-background"
                    )}
                  >
                    {o === "all" ? "Everyone" : o === "studio" ? "Our team" : "Client"}
                  </button>
                ))}
              </div>
              <Select value={filter.priority} onValueChange={(v) => setFilter({ ...filter, priority: v as TaskFilter["priority"] })}>
                <SelectTrigger className="w-40 bg-card" aria-label="Filter by priority"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All priorities</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
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
          <main className="flex flex-1 flex-col items-center justify-center p-6 text-center">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-sky-500 text-white shadow-lg shadow-blue-600/25">
              <FolderPlus className="size-6" />
            </div>
            <h1 className="mt-5 text-2xl font-bold tracking-tight">Start your first client project</h1>
            <p className="mt-2 max-w-sm text-muted-foreground">Add the client, a deadline and a few tasks. Then share a live status link so they always know where things stand.</p>
            <Button className="mt-6" onClick={() => setProjectDialog({ open: true, edit: false })}><FolderPlus /> New client project</Button>
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
      <Dialog open={helpOpen} onOpenChange={setHelpOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Keyboard shortcuts</DialogTitle>
            <DialogDescription>Work faster without leaving the keyboard.</DialogDescription>
          </DialogHeader>
          <ul className="divide-y rounded-xl border">
            {SHORTCUTS.map((sc) => (
              <li key={sc.action} className="flex items-center justify-between px-4 py-2.5 text-sm">
                {sc.label}
                <kbd className="rounded-md border bg-muted px-2 py-0.5 text-xs font-semibold">{sc.keys}</kbd>
              </li>
            ))}
            <li className="flex items-center justify-between px-4 py-2.5 text-sm">
              Move a focused card
              <span className="flex gap-1">
                <kbd className="rounded-md border bg-muted px-2 py-0.5 text-xs font-semibold">Space</kbd>
                <kbd className="rounded-md border bg-muted px-2 py-0.5 text-xs font-semibold">← →</kbd>
              </span>
            </li>
          </ul>
        </DialogContent>
      </Dialog>
      <ProjectDialog
        key={`project-${projectDialog.n}`}
        open={projectDialog.open}
        project={projectDialog.edit ? project : null}
        onOpenChange={(open) => setProjectDialogState((d) => ({ ...d, open }))}
      />
    </div>
  );
}

function Stat({ label, value, sub, icon, tone, children }: { label: string; value: string; sub: string; icon?: React.ReactNode; tone?: "danger"; children?: React.ReactNode }) {
  return (
    <div className="border-b p-5 last:border-b-0 sm:[&:nth-child(odd)]:border-r xl:border-b-0 xl:border-r xl:last:border-r-0">
      <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
        {icon}
      </div>
      <p className={cn("mt-2 text-3xl font-extrabold tabular-nums tracking-tight", tone === "danger" && "text-red-600 dark:text-red-400")}>{value}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>
      {children}
    </div>
  );
}
