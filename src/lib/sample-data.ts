import { DEFAULT_COLUMNS, type Project, type Task } from "./types";

const DAY = 86_400_000;
const day = (offset: number, now: number) => new Date(now + offset * DAY).toISOString().slice(0, 10);

type Seed = [title: string, column: string, tag: Task["tag"], priority: Task["priority"], owner: Task["owner"], dueOffset?: number];

function build(id: string, seeds: Seed[], now: number): Task[] {
  return seeds.map(([title, columnId, tag, priority, owner, dueOffset], i) => ({
    id: `${id}-t${i + 1}`,
    columnId,
    title,
    description: "",
    priority,
    owner,
    tag,
    due: dueOffset === undefined ? undefined : day(dueOffset, now),
    createdAt: new Date(now - (30 - i) * DAY).toISOString(),
    completedAt: columnId === "done" ? new Date(now - (12 - i) * DAY).toISOString() : undefined,
  }));
}

/** Fictional demo projects. Names are invented for the demo, not real clients. */
export function sampleProjects(now = Date.now()): Project[] {
  return [
    {
      id: "p-website",
      name: "Website redesign",
      client: "Harbor & Pine Café",
      description: "New mobile-first website with online menu, table booking and Google reviews.",
      color: "#2563eb",
      startDate: day(-28, now),
      dueDate: day(16, now),
      columns: DEFAULT_COLUMNS,
      tasks: build(
        "p-website",
        [
          ["Kick-off call and goals workshop", "done", "Design", "high", "studio"],
          ["Collect logo, photos and menu PDF", "done", "Content", "medium", "client"],
          ["Sitemap and wireframes", "done", "Design", "high", "studio"],
          ["Homepage visual design", "review", "Design", "high", "studio", 1],
          ["Approve homepage design", "review", "Design", "high", "client", 2],
          ["Build responsive page templates", "in-progress", "Development", "high", "studio", 6],
          ["Table booking integration", "in-progress", "Automation", "medium", "studio", 8],
          ["Write About and Catering copy", "todo", "Content", "medium", "client", -1],
          ["On-page SEO and Google Business profile", "todo", "SEO", "medium", "studio", 12],
          ["Speed and accessibility audit", "todo", "Development", "low", "studio", 13],
          ["Launch and DNS switch", "todo", "Launch", "high", "studio", 16],
        ],
        now
      ),
    },
    {
      id: "p-app",
      name: "Booking app MVP",
      client: "Glow Studio Spa",
      description: "Mobile booking app with deposits, reminders and a staff calendar.",
      color: "#0ea5e9",
      startDate: day(-12, now),
      dueDate: day(45, now),
      columns: DEFAULT_COLUMNS,
      tasks: build(
        "p-app",
        [
          ["User flows for booking and rescheduling", "done", "Design", "high", "studio"],
          ["Clickable prototype", "review", "Design", "high", "studio", 3],
          ["Confirm service list and prices", "todo", "Content", "high", "client", 4],
          ["Auth and customer profiles", "in-progress", "Development", "high", "studio", 10],
          ["Automated SMS and email reminders", "todo", "Automation", "medium", "studio", 20],
          ["Deposit payments", "todo", "Development", "high", "studio", 25],
          ["App store listing assets", "todo", "Launch", "low", "studio", 40],
        ],
        now
      ),
    },
    {
      id: "p-brand",
      name: "Brand refresh & launch content",
      client: "Northwind Fitness",
      description: "Logo refresh, brand guide and a month of launch posts and reels.",
      color: "#f97316",
      startDate: day(-40, now),
      dueDate: day(3, now),
      columns: DEFAULT_COLUMNS,
      tasks: build(
        "p-brand",
        [
          ["Mood board and direction", "done", "Design", "medium", "studio"],
          ["Logo concepts", "done", "Design", "high", "studio"],
          ["Pick final logo", "done", "Design", "high", "client"],
          ["Brand guide PDF", "done", "Design", "medium", "studio"],
          ["Launch reel edit", "review", "Content", "high", "studio", 0],
          ["Approve launch reel", "review", "Content", "high", "client", 1],
          ["Schedule 12 launch posts", "in-progress", "Content", "medium", "studio", 3],
        ],
        now
      ),
    },
  ];
}
