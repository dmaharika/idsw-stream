import "server-only";

export type DayId = "1" | "2";
export type VideoDay = { id: DayId; label: string; available: boolean };

const idPattern = /^[A-Za-z0-9_-]+$/;

// Only public day labels reach the page. Playback IDs and tokens stay in server routes.
export function getVideoConfig() {
  const defaultDay: DayId = process.env.DEFAULT_DAY?.trim() === "2" ? "2" : "1";
  return {
    days: (["1", "2"] as DayId[]).map((id) => ({
      id,
      label: `Day ${id}`,
      available: idPattern.test(process.env[id === "1" ? "DAY_1_ID" : "DAY_2_ID"]?.trim() || ""),
    })),
    defaultDay,
  };
}
