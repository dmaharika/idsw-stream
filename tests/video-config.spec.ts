import { expect, test } from "@playwright/test";
import { getVideoConfig } from "../config/video";

test("invalid settings fall back to Day 1 and never form malformed embed URLs", () => {
  const keys = ["DAY_1_ID", "DAY_2_ID", "DEFAULT_DAY"] as const;
  const previous = keys.map((key) => process.env[key]);
  try {
    process.env.DEFAULT_DAY = "3";
    process.env.DAY_1_ID = "https://drive.google.com/file/d/not-an-id/view";
    process.env.DAY_2_ID = "  test-day-2  ";
    const config = getVideoConfig();
    expect(config.defaultDay).toBe("1");
    expect(config.days[0].video).toBeNull();
    expect(config.days[1].video?.embedUrl).toBe("https://drive.google.com/file/d/test-day-2/preview");

    keys.forEach((key) => delete process.env[key]);
    const emptyConfig = getVideoConfig();
    expect(emptyConfig.defaultDay).toBe("1");
    expect(emptyConfig.days.every((day) => day.video === null)).toBe(true);
  } finally {
    keys.forEach((key, index) => {
      if (previous[index] === undefined) delete process.env[key];
      else process.env[key] = previous[index];
    });
  }
});
