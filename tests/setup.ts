import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

afterEach(() => {
  cleanup();
  document.title = "";
  document.querySelectorAll('meta[name], meta[property], link[rel="canonical"]').forEach((node) => node.remove());
});
