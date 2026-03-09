import type { LogEntry } from "../types/content";

function buildProofUrl(entry: LogEntry): string | null {
  if (!entry.proofUrl) {
    return null;
  }
  if (entry.proofUrl.startsWith("http://") || entry.proofUrl.startsWith("https://")) {
    return entry.proofUrl;
  }
  if (typeof window !== "undefined") {
    return `${window.location.origin}${entry.proofUrl}`;
  }
  return entry.proofUrl;
}

export function formatBuildPost(entry: LogEntry): string {
  const proofUrl = buildProofUrl(entry);
  const toolLine = entry.tools.slice(0, 4).join(", ");
  const base = [
    `Shipped (${entry.date})`,
    `${entry.build}`,
    `Learned: ${entry.learned}`,
    entry.impact ? `Impact: ${entry.impact}` : null,
    toolLine ? `Tools: ${toolLine}` : null,
    proofUrl ? `Proof: ${proofUrl}` : null,
    "#buildinpublic #softwareengineering"
  ]
    .filter(Boolean)
    .join("\n");

  return base;
}

export async function copyBuildPost(entry: LogEntry): Promise<boolean> {
  const text = formatBuildPost(entry);
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export function downloadBuildPostCard(entry: LogEntry): void {
  const text = formatBuildPost(entry);
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `build-update-${entry.date}.txt`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
