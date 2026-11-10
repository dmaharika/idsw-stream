"use client";

import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from "react";
import AuthOverlay from "./AuthOverlay";
import MuxVideoPlayer from "./MuxVideoPlayer";
import { api, APIError, errorMessage } from "@/lib/client-api";
import type { Playback } from "@/lib/auth/service";
import type { DayId, VideoDay } from "@/config/video";

type Props = { days: VideoDay[]; defaultDay: DayId };

function PlaybackPanel({ day, onLocked }: { day: DayId; onLocked: (message: string) => void }) {
  const [playback, setPlayback] = useState<Playback | null>(null);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    let refreshTimer: ReturnType<typeof setTimeout>;
    let expiryTimer: ReturnType<typeof setTimeout>;
    let inFlight = false;
    let current: Playback | null = null;
    const refresh = async () => {
      if (inFlight || controller.signal.aborted) return;
      inFlight = true;
      try {
        const next = await api<Playback>("/api/mux/token", { day: Number(day) }, controller.signal);
        if (controller.signal.aborted) return;
        current = next;
        setPlayback(next);
        setError("");
        clearTimeout(refreshTimer);
        clearTimeout(expiryTimer);
        const remaining = next.expiresAt - Date.now();
        refreshTimer = setTimeout(refresh, Math.max(5_000, remaining - 60_000));
        expiryTimer = setTimeout(() => {
          current = null;
          setPlayback(null);
          setError("Your recording needs to reconnect. Please try again.");
        }, Math.max(0, remaining));
      } catch (cause) {
        if (controller.signal.aborted) return;
        if (cause instanceof APIError && [401, 403].includes(cause.status)) {
          onLocked(cause.message);
          return;
        }
        setError(errorMessage(cause));
        refreshTimer = setTimeout(refresh, 15_000);
      } finally {
        inFlight = false;
      }
    };
    const resume = () => {
      if (document.visibilityState === "visible" && (!current || current.expiresAt - Date.now() < 90_000))
        void refresh();
    };
    void refresh();
    document.addEventListener("visibilitychange", resume);
    window.addEventListener("online", resume);
    return () => {
      controller.abort();
      clearTimeout(refreshTimer);
      clearTimeout(expiryTimer);
      document.removeEventListener("visibilitychange", resume);
      window.removeEventListener("online", resume);
    };
  }, [day, retry, onLocked]);

  return (
    <>
      {playback ? (
        <MuxVideoPlayer playback={playback} day={Number(day) as 1 | 2} eventName="IDSW" onError={() => setError("Playback is unavailable. Please try again.")} />
      ) : (
        <div className="stream-player stream-unavailable" role="status">
          <p>{error || "Preparing your recording…"}</p>
        </div>
      )}
      {error && (
        <div className="stream-playback-error" role="alert">
          <span>{error}</span>
          <button type="button" onClick={() => { setPlayback(null); setError(""); setRetry((value) => value + 1); }}>Try again</button>
        </div>
      )}
    </>
  );
}

export default function VideoTabs({ days, defaultDay }: Props) {
  const [selectedDay, setSelectedDay] = useState(defaultDay);
  const [state, setState] = useState<"checking" | "locked" | "authenticated">("checking");
  const [notice, setNotice] = useState("");
  const [sessionRetry, setSessionRetry] = useState(0);
  const [logoutBusy, setLogoutBusy] = useState(false);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const lock = useCallback((message: string) => { setState("locked"); setNotice(message); }, []);

  useEffect(() => {
    const controller = new AbortController();
    api<{ authenticated: boolean }>("/api/auth/session", undefined, controller.signal)
      .then((result) => {
        if (!controller.signal.aborted) {
          setState(result.authenticated ? "authenticated" : "locked");
          setNotice("");
        }
      })
      .catch((cause) => {
        if (!controller.signal.aborted) setNotice(errorMessage(cause));
      });
    return () => controller.abort();
  }, [sessionRetry]);

  async function logout() {
    setLogoutBusy(true);
    try {
      await api("/api/auth/logout", {});
      lock("You have signed out.");
    } catch (cause) {
      setNotice(errorMessage(cause));
    } finally {
      setLogoutBusy(false);
    }
  }

  function focusTab(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    let next: number;
    switch (event.key) {
      case "ArrowRight": next = (index + 1) % days.length; break;
      case "ArrowLeft": next = (index - 1 + days.length) % days.length; break;
      case "Home": next = 0; break;
      case "End": next = days.length - 1; break;
      default: return;
    }
    event.preventDefault();
    tabs.current[next]?.focus();
  }

  return (
    <>
      <div className="stream-tabs" role="tablist" aria-label="Conference day">
        {days.map((day, index) => (
          <button key={day.id} ref={(element) => { tabs.current[index] = element; }} type="button" role="tab"
            id={`day-tab-${day.id}`} aria-controls={`day-panel-${day.id}`} aria-selected={selectedDay === day.id}
            tabIndex={selectedDay === day.id ? 0 : -1} className="stream-tab"
            onClick={() => setSelectedDay(day.id)} onKeyDown={(event) => focusTab(event, index)}>
            {day.label}
          </button>
        ))}
      </div>
      {state === "authenticated" && (
        <div className="stream-access"><span>Attendee access</span><button type="button" onClick={logout} disabled={logoutBusy}>{logoutBusy ? "Signing out…" : "Sign out"}</button></div>
      )}
      {days.map((day) => (
        <div key={day.id} role="tabpanel" id={`day-panel-${day.id}`} aria-labelledby={`day-tab-${day.id}`}
          hidden={selectedDay !== day.id} tabIndex={0} className="stream-panel">
          {selectedDay === day.id && (state === "checking" ? (
            <div className="stream-player stream-unavailable" role="status">
              <p>{notice || "Checking your access…"}</p>
              {notice && <button type="button" onClick={() => { setNotice(""); setSessionRetry((value) => value + 1); }}>Try again</button>}
            </div>
          ) : state === "locked" ? (
            <AuthOverlay onAuthenticated={() => { setNotice(""); setState("authenticated"); }} notice={notice} />
          ) : day.available ? (
            <PlaybackPanel key={day.id} day={day.id} onLocked={lock} />
          ) : (
            <div className="stream-player stream-unavailable" role="status">
              <p>{day.label} recording is not available yet.</p><p>Please try the other day or check back later.</p>
            </div>
          ))}
        </div>
      ))}
    </>
  );
}
