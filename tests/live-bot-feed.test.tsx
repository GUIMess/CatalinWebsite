import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { LiveBotFeed } from "../src/components/home/LiveBotFeed";

describe("LiveBotFeed", () => {
  it("announces the correct chart time window when 30-day activity is shown", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          status: "live",
          dataMode: "full",
          generatedAt: "2026-03-20T04:15:26.049Z",
          commands24h: 0,
          commands30d: 0,
          commandsAllTime: 2484,
          newsPosts24h: 0,
          newsPosts30d: 3088,
          activity24h: new Array(24).fill(0),
          activity30d: [0, 0, 0, 4, 8, 12, 16, 32, 24, 12],
          avgResponseMs24h: null,
          avgResponseMs30d: null,
          avgResponseMsSinceRestart: 3259,
          errorRate24h: null,
          errorRate30d: null,
          errorRateSinceRestart: 0,
          cacheHitRate: 96.1,
          discordPingMs: 35,
          lastActiveAt: "2026-03-20T04:11:10.034Z",
          featureMix24h: [],
          featureMix30d: []
        }
      })
    } as Response);

    render(<LiveBotFeed />);

    expect(await screen.findByLabelText(/last 30 days/i)).toBeInTheDocument();
  });
});
