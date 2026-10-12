import { connection } from "next/server";
import VideoTabs from "@/components/VideoTabs";
import { getVideoConfig } from "@/config/video";

export default async function HomePage() {
  await connection();
  const { days, defaultDay } = getVideoConfig();

  return (
    <main id="main" tabIndex={-1} aria-label="IDSW stream">
      <div className="hero-gradient hero-stage relative overflow-hidden text-white stream-content">
        <div className="hero-accent" aria-hidden="true">
          <div className="hero-accent-radiance"></div>
          <div className="hero-accent-cyan"></div>
          <div className="hero-accent-violet"></div>
        </div>
        <div className="container-site stream-video-container">
          <section className="stream-video" aria-label="Conference recordings">
            <VideoTabs days={days} defaultDay={defaultDay} />
          </section>
        </div>
      </div>
    </main>
  );
}
