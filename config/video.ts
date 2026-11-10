import "server-only";

export type DayId = "1" | "2";
export type VideoDay = { id: DayId; label: string; available: boolean };

const idPattern = /^[A-Za-z0-9_-]+$/;

export function isDay2Hidden() {
  return process.env.HIDE_DAY_2?.trim().toLowerCase() === "true";
}

// Only public day labels reach the page. Playback IDs and tokens stay in server routes.
export function getVideoConfig() {
  const hideDay2 = isDay2Hidden();
  const visibleDays: DayId[] = hideDay2 ? ["1"] : ["1", "2"];
  const defaultDay: DayId = !hideDay2 && process.env.DEFAULT_DAY?.trim() === "2" ? "2" : "1";
  return {
    days: visibleDays.map((id) => ({
      id,
      label: `Day ${id}`,
      available: idPattern.test(process.env[id === "1" ? "DAY_1_ID" : "DAY_2_ID"]?.trim() || ""),
    })),
    defaultDay,
  };
}
