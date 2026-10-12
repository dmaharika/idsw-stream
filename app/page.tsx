import { video } from "@/config/video";

export default function HomePage() {
  return (
    <main id="main" tabIndex={-1} aria-label="IDSW stream">
      <div className="hero-gradient hero-stage relative overflow-hidden text-white stream-content">
        <div className="hero-accent" aria-hidden="true">
          <div className="hero-accent-radiance"></div>
          <div className="hero-accent-cyan"></div>
          <div className="hero-accent-violet"></div>
        </div>
        <div className="container-site stream-video-container">
          <section className="stream-video" aria-labelledby="stream-heading">
            <h1 id="stream-heading" className="font-display stream-heading">
              IDSW Stream
            </h1>
            <iframe
              className="stream-player"
              src={video.embedUrl}
              title={video.title}
              width="1280"
              height="720"
              allow="fullscreen"
              allowFullScreen
            />
            <p className="stream-help">
              Having trouble playing the video?{" "}
              <a href={video.watchUrl} target="_blank" rel="noopener noreferrer">
                Open in Google Drive<span className="sr-only"> (new tab)</span>
              </a>
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
