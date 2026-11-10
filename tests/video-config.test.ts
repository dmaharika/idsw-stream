import assert from "node:assert/strict";
import { test } from "node:test";
import { NextRequest } from "next/server";
import { getVideoConfig } from "../config/video";
import { POST as playbackToken } from "../app/api/mux/token/route";

test("HIDE_DAY_2 removes Day 2, overrides the default, and blocks direct token requests", async () => {
  const names = ["HIDE_DAY_2", "DEFAULT_DAY", "DAY_1_ID", "DAY_2_ID", "APP_URL"] as const;
  const previous = Object.fromEntries(names.map((name) => [name, process.env[name]]));
  try {
    Object.assign(process.env, {
      HIDE_DAY_2: "true",
      DEFAULT_DAY: "2",
      DAY_1_ID: "test-day-1",
      DAY_2_ID: "test-day-2",
      APP_URL: "http://localhost:3000",
    });
    assert.deepEqual(getVideoConfig(), {
      days: [{ id: "1", label: "Day 1", available: true }],
      defaultDay: "1",
    });
    const request = new NextRequest("http://localhost:3000/api/mux/token", {
      method: "POST",
      headers: { origin: "http://localhost:3000", "content-type": "application/json" },
      body: JSON.stringify({ day: 2 }),
    });
    const response = await playbackToken(request);
    assert.equal(response.status, 404);
    assert.match(await response.text(), /Day 2 recording is not available yet/);

    process.env.HIDE_DAY_2 = "false";
    assert.deepEqual(getVideoConfig().days.map((day) => day.id), ["1", "2"]);
    assert.equal(getVideoConfig().defaultDay, "2");
  } finally {
    for (const name of names) {
      const value = previous[name];
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    }
  }
});
