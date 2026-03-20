import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  if (typeof window !== "undefined" && window.localStorage && typeof window.localStorage.clear === "function") {
    window.localStorage.clear();
  }
  document.title = "";
  document.querySelectorAll('meta[name], meta[property], link[rel="canonical"]').forEach((node) => node.remove());
});
