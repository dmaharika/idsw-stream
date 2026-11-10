"use client";

import MuxPlayer from "@mux/mux-player-react";
import { useRef, useState, type KeyboardEvent } from "react";
import type { DayId, VideoDay } from "@/config/video";

type Props = {
  days: VideoDay[];
  defaultDay: DayId;
};

export default function VideoTabs({ days, defaultDay }: Props) {
  const [selectedDay, setSelectedDay] = useState(defaultDay);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);

  function focusTab(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    let next: number;
    switch (event.key) {
      case "ArrowRight":
        next = (index + 1) % days.length;
        break;
      case "ArrowLeft":
        next = (index - 1 + days.length) % days.length;
        break;
      case "Home":
        next = 0;
        break;
      case "End":
        next = days.length - 1;
        break;
      default:
        return;
    }
    event.preventDefault();
    // Focus alone must not interrupt a recording; Enter/Space activates a tab.
    tabs.current[next]?.focus();
  }

  return (
    <>
      <div className="stream-tabs" role="tablist" aria-label="Conference day">
        {days.map((day, index) => (
          <button
            key={day.id}
            ref={(element) => { tabs.current[index] = element; }}
            type="button"
            role="tab"
            id={`day-tab-${day.id}`}
            aria-controls={`day-panel-${day.id}`}
            aria-selected={selectedDay === day.id}
            tabIndex={selectedDay === day.id ? 0 : -1}
            className="stream-tab"
            onClick={() => setSelectedDay(day.id)}
            onKeyDown={(event) => focusTab(event, index)}
          >
            {day.label}
          </button>
        ))}
      </div>
      {days.map((day) => (
        <div
          key={day.id}
          role="tabpanel"
          id={`day-panel-${day.id}`}
          aria-labelledby={`day-tab-${day.id}`}
          hidden={selectedDay !== day.id}
          tabIndex={0}
          className="stream-panel"
        >
          {selectedDay === day.id && (day.video ? (
            <MuxPlayer
              key={day.id}
              className="stream-player"
              playbackId={day.video.playbackId}
              tokens={day.video.tokens}
              streamType="on-demand"
              title={day.video.title}
              preload="none"
            />
          ) : (
            <div className="stream-player stream-unavailable" role="status">
              <p>{day.label} recording is not available yet.</p>
              <p>Please try the other day or check back later.</p>
            </div>
          ))}
        </div>
      ))}
    </>
  );
}
