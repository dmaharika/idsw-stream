export type DayId = "1" | "2";

export type VideoDay = {
  id: DayId;
  label: string;
  video: {
    title: string;
    embedUrl: string;
    watchUrl: string;
  } | null;
};

function createDay(id: DayId, value: string | undefined): VideoDay {
  const fileId = value?.trim();
  const label = `Day ${id}`;

  return {
    id,
    label,
    video: fileId && /^[a-zA-Z0-9_-]+$/.test(fileId)
      ? {
          title: `IDSW conference recording — ${label}`,
          embedUrl: `https://drive.google.com/file/d/${fileId}/preview`,
          watchUrl: `https://drive.google.com/file/d/${fileId}/view`,
        }
      : null,
  };
}

// Read on the server after connection(), so settings come from runtime env.
export function getVideoConfig() {
  const defaultDay: DayId = process.env.DEFAULT_DAY?.trim() === "2" ? "2" : "1";
  return {
    days: [
      createDay("1", process.env.DAY_1_ID),
      createDay("2", process.env.DAY_2_ID),
    ],
    defaultDay,
  };
}
