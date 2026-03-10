import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { WorkPage } from "../src/pages/WorkPage";

describe("WorkPage", () => {
  it("renders a project not found state for unknown slugs", () => {
    render(
      <MemoryRouter
        initialEntries={["/work/not-a-real-project"]}
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <Routes>
          <Route path="/work/:slug" element={<WorkPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByRole("heading", { name: "Project not found" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Production Sports Bot" })).not.toBeInTheDocument();
    expect(document.title).toBe("Project Not Found | Catalin Siegling");
    expect(document.querySelector('meta[name="robots"]')?.getAttribute("content")).toBe("noindex,nofollow");
  });
});
