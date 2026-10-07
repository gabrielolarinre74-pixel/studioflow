import { CalendarClock, CheckCircle2, Clock, Hourglass, Lock } from "lucide-react";
import { formatDay, isOverdue, projectStats } from "@/lib/board";
import type { Snapshot } from "@/lib/share";
import { DONE_COLUMN, REVIEW_COLUMN, type Task } from "@/lib/types";
import { ProgressRing } from "./ProgressRing";
import { ThemeToggle } from "./ThemeToggle";
import { Logo } from "./Logo";

const DATE_OPTS: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" };
// Date-only values are calendar days; full ISO timestamps are shown in the viewer's time zone
const fmt = (d?: string) => (!d ? "No date" : d.length === 10 ? formatDay(d, DATE_OPTS) : new Date(d).toLocaleDateString(undefined, DATE_OPTS));

/** Read-only client status page rendered from a share link. */
export function ShareView({ snapshot }: { snapshot: Snapshot }) {
  const { project, at } = snapshot;
  const stats = projectStats(project);
  const waiting = project.tasks.filter((t) => t.columnId !== DONE_COLUMN && (t.owner === "client" || t.columnId === REVIEW_COLUMN));
  const inProgress = project.tasks.filter((t) => t.columnId !== DONE_COLUMN && !waiting.includes(t));
  const done = project.tasks
    .filter((t) => t.columnId === DONE_COLUMN)
    .sort((a, b) => (b.completedAt ?? "").localeCompare(a.completedAt ?? ""));

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b bg-background">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <Logo />
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Lock className="size-3.5" /> Read-only status page
            <ThemeToggle />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-4xl space-y-6 px-4 py-8">
        <section className="overflow-hidden rounded-2xl border bg-background shadow-sm">
          <div className="h-2" style={{ backgroundColor: project.color }} />
          <div className="flex flex-col gap-6 p-6 sm:flex-row sm:items-center">
            <ProgressRing value={stats.progress} color={project.color} size={88} />
            <div className="flex-1">
              <p className="text-sm font-medium text-muted-foreground">Project update for {project.client}</p>
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{project.name}</h1>
              {project.description && <p className="mt-1 text-muted-foreground">{project.description}</p>}
            </div>
          </div>
          <dl className="grid grid-cols-2 border-t sm:grid-cols-4">
            <Stat label="Completed" value={`${stats.done} of ${stats.total}`} />
            <Stat label="Waiting on you" value={String(waiting.length)} highlight={waiting.length > 0} />
            <Stat label="Deadline" value={fmt(project.dueDate)} />
            <Stat
              label="Time left"
              value={stats.daysLeft === undefined ? "–" : stats.daysLeft >= 0 ? `${stats.daysLeft} days` : `${-stats.daysLeft} days over`}
            />
          </dl>
        </section>

        <TaskSection
          icon={Hourglass}
          title="Waiting on you"
          empty="Nothing needs your input right now."
          tasks={waiting}
          accent="text-sky-600 dark:text-sky-400"
        />
        <TaskSection icon={Clock} title="In progress" empty="No work in progress." tasks={inProgress} accent="text-amber-600 dark:text-amber-400" />
        <TaskSection icon={CheckCircle2} title="Completed" empty="Nothing completed yet." tasks={done} accent="text-emerald-600 dark:text-emerald-400" done />

        <p className="text-center text-xs text-muted-foreground">
          Snapshot taken {new Date(at).toLocaleString()} · Ask your project lead for a fresh link to see later changes.
        </p>
      </main>
    </div>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="border-r p-4 last:border-r-0">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className={`mt-1 font-semibold ${highlight ? "text-sky-600 dark:text-sky-400" : ""}`}>{value}</dd>
    </div>
  );
}

function TaskSection({
  icon: Icon,
  title,
  tasks,
  empty,
  accent,
  done,
}: {
  icon: typeof Clock;
  title: string;
  tasks: Task[];
  empty: string;
  accent: string;
  done?: boolean;
}) {
  return (
    <section className="rounded-2xl border bg-background p-6 shadow-sm">
      <h2 className={`mb-4 flex items-center gap-2 font-semibold ${accent}`}>
        <Icon className="size-5" /> {title} <span className="text-sm font-normal text-muted-foreground">({tasks.length})</span>
      </h2>
      {tasks.length === 0 ? (
        <p className="text-sm text-muted-foreground">{empty}</p>
      ) : (
        <ul className="divide-y">
          {tasks.map((t) => (
            <li key={t.id} className="flex items-center justify-between gap-4 py-3">
              <div className="min-w-0">
                <p className={`text-sm font-medium ${done ? "text-muted-foreground line-through decoration-muted-foreground/40" : ""}`}>{t.title}</p>
                <p className="text-xs text-muted-foreground">{t.tag}</p>
              </div>
              {done ? (
                <span className="shrink-0 text-xs text-muted-foreground">{fmt(t.completedAt)}</span>
              ) : t.due ? (
                <span className={`flex shrink-0 items-center gap-1 text-xs ${isOverdue(t) ? "font-semibold text-rose-600" : "text-muted-foreground"}`}>
                  <CalendarClock className="size-3.5" /> {fmt(t.due)}
                </span>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
