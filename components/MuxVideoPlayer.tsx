"use client";

import MuxPlayer, { type MuxPlayerRefAttributes } from "@mux/mux-player-react";
import { useEffect, useRef, useState } from "react";
import type { Playback } from "@/lib/auth/service";

export default function MuxVideoPlayer({
  playback,
  day,
  eventName,
  onError,
}: {
  playback: Playback;
  day: 1 | 2;
  eventName: string;
  onError: () => void;
}) {
  const player = useRef<MuxPlayerRefAttributes>(null);
  const [initialTokens] = useState(playback.tokens);
  useEffect(() => {
    const element = player.current;
    if (!element || element.tokens.playback === playback.tokens.playback)
      return;
    const position = element.currentTime;
    const wasPaused = element.paused;
    const wasReplay = element.streamType === "on-demand";
    const restore = () => {
      if (wasReplay && Number.isFinite(position))
        element.currentTime = position;
      if (!wasPaused)
        void element.play().catch(() => {
          /* Browser may require a new play gesture. */
        });
    };
    element.addEventListener("loadedmetadata", restore, { once: true });
    // Updating signed URLs can reload media; preserve replay position and playing state.
    element.tokens = playback.tokens;
    return () => element.removeEventListener("loadedmetadata", restore);
  }, [playback.tokens]);
  return (
    <MuxPlayer
      ref={player}
      className="stream-player"
      playbackId={playback.playbackId}
      tokens={initialTokens}
      metadata={{ video_title: `${eventName} — Day ${day}` }}
      accentColor="#ffffff"
      primaryColor="#ffffff"
      title={`${eventName} — Day ${day}`}
      preload="none"
      playsInline
      onError={onError}
      style={{
        width: "100%",
        aspectRatio: "16 / 9",
        "--airplay-button": "none",
        "--cast-button": "none",
      }}
    />
  );
}
