import { CalendarClock, CheckCircle2, Clock, Hourglass, Lock } from "lucide-react";
import { formatDay, isOverdue, projectStats } from "@/lib/board";
import type { Snapshot } from "@/lib/share";
import { DONE_COLUMN, REVIEW_COLUMN, type Task } from "@/lib/types";
import { ProgressRing } from "./ProgressRing";
import { ThemeToggle } from "./ThemeToggle";

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

  const pct = Math.round(stats.progress * 100);
  return (
    <div className="min-h-screen bg-background">
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-700 via-blue-600 to-sky-500 pb-28 text-white">
        <div className="pointer-events-none absolute -right-24 -top-24 size-96 rounded-full bg-white/10 blur-3xl" />
        <header className="relative mx-auto flex max-w-4xl items-center justify-between px-5 py-5">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/25">
              <svg viewBox="0 0 24 24" className="size-5 fill-white" aria-hidden>
                <rect x="3" y="4" width="5" height="16" rx="1.5" />
                <rect x="9.5" y="4" width="5" height="10" rx="1.5" opacity=".85" />
                <rect x="16" y="4" width="5" height="6" rx="1.5" opacity=".7" />
              </svg>
            </div>
            <span className="font-bold">StudioFlow</span>
          </div>
          <span className="flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-medium ring-1 ring-white/20">
            <Lock className="size-3.5" /> Read-only status page
          </span>
        </header>
        <div className="relative mx-auto max-w-4xl px-5 pt-8">
          <p className="text-sm font-medium text-white/75">Project update for {project.client}</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-5xl">{project.name}</h1>
          {project.description && <p className="mt-3 max-w-2xl text-white/80">{project.description}</p>}
        </div>
      </div>

      <main className="relative mx-auto -mt-20 max-w-4xl space-y-6 px-5 pb-12">
        <section className="overflow-hidden rounded-2xl border bg-card shadow-[0_24px_48px_-24px_rgb(15_23_42/0.35)]">
          <div className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center">
            <ProgressRing value={stats.progress} color="#2563eb" size={92} />
            <div className="flex-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Overall progress</p>
              <p className="mt-1 text-4xl font-extrabold tabular-nums tracking-tight">{pct}%</p>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-gradient-to-r from-blue-600 to-sky-400" style={{ width: `${pct}%` }} />
              </div>
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
          accent="bg-sky-500/15 text-sky-700 dark:text-sky-300"
        />
        <TaskSection icon={Clock} title="In progress" empty="No work in progress." tasks={inProgress} accent="bg-blue-600/10 text-blue-700 dark:text-blue-300" />
        <TaskSection icon={CheckCircle2} title="Completed" empty="Nothing completed yet." tasks={done} accent="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300" done />

        <div className="flex flex-col items-center gap-3 pt-2 text-center text-xs text-muted-foreground">
          <ThemeToggle />
          <p>
            Snapshot taken {new Date(at).toLocaleString()} · Ask your project lead for a fresh link to see later changes.
          </p>
        </div>
      </main>
    </div>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="border-r p-5 last:border-r-0 [&:nth-child(2)]:max-sm:border-r-0">
      <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</dt>
      <dd className={`mt-1.5 text-lg font-bold ${highlight ? "text-blue-600 dark:text-blue-400" : ""}`}>{value}</dd>
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
    <section className="rounded-2xl border bg-card p-6 shadow-[0_1px_2px_rgb(15_23_42/0.04)]">
      <h2 className="mb-4 flex items-center gap-3 text-lg font-bold">
        <span className={`flex size-8 items-center justify-center rounded-lg ${accent}`}>
          <Icon className="size-4" />
        </span>
        {title}
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">{tasks.length}</span>
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
                <span className={`flex shrink-0 items-center gap-1 text-xs ${isOverdue(t) ? "font-semibold text-red-600" : "text-muted-foreground"}`}>
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
