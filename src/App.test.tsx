import { beforeEach, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App";
import { useStore } from "./lib/store";
import { encodeSnapshot } from "./lib/share";
import { sampleProjects } from "./lib/sample-data";

describe("App", () => {
  beforeEach(() => {
    localStorage.clear();
    window.location.hash = "";
    useStore.getState().resetDemo();
  });

  it("renders the active project board", () => {
    render(<App />);
    expect(screen.getByRole("heading", { level: 1, name: "Website redesign" })).toBeInTheDocument();
    for (const col of ["To do", "In progress", "Client review", "Done"]) {
      expect(screen.getByRole("region", { name: col })).toBeInTheDocument();
    }
  });

  it("validates the new task form", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: /new task/i }));
    await user.click(screen.getByRole("button", { name: /add task/i }));
    expect(screen.getByText(/give the task a short title/i)).toBeInTheDocument();
    await user.type(screen.getByLabelText("Title"), "Send invoice");
    await user.click(screen.getByRole("button", { name: /add task/i }));
    expect(useStore.getState().projects[0].tasks.some((t) => t.title === "Send invoice")).toBe(true);
  });

  it("shows a read-only client page for a share link", () => {
    window.location.hash = `#share=${encodeSnapshot(sampleProjects()[1])}`;
    render(<App />);
    expect(screen.getByText(/read-only status page/i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Booking app MVP" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /new task/i })).not.toBeInTheDocument();
  });

  it("explains broken share links", () => {
    window.location.hash = "#share=broken";
    render(<App />);
    expect(screen.getByText(/broken or incomplete/i)).toBeInTheDocument();
  });

  it("opens the new task form and the shortcut list from the keyboard", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.keyboard("n");
    expect(await screen.findByLabelText("Title")).toBeInTheDocument();
    await user.keyboard("{Escape}");
    await user.keyboard("?");
    expect(await screen.findByRole("heading", { name: "Keyboard shortcuts" })).toBeInTheDocument();
  });

  it("does not trigger shortcuts while typing in search", async () => {
    const user = userEvent.setup();
    render(<App />);
    const search = screen.getAllByPlaceholderText("Search tasks")[0];
    await user.click(search);
    await user.keyboard("n");
    expect(search).toHaveValue("n");
    expect(screen.queryByLabelText("Title")).not.toBeInTheDocument();
  });
});
