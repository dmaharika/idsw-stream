import Image from "next/image";
import HeaderBehavior from "./HeaderBehavior";

export default function SiteHeader() {
  return (
    <header className="site-header fixed top-0 right-0 left-0 z-50">
      <nav className="site-nav border-b border-transparent py-4 transition-[background-color,box-shadow,border-color,padding] duration-500 ease-out">
        <div className="relative mx-auto max-w-[1280px] px-6 md:px-10">
          <input
            id="nav-toggle"
            aria-controls="site-nav-panel"
            aria-expanded="false"
            type="checkbox"
            className="peer sr-only"
          />
          <div className="flex items-center justify-between">
            <a
              href="https://www.idsw.dev/"
              className="relative z-10 flex items-center"
            >
              <Image
                width={264}
                height={120}
                unoptimized
                loading="eager"
                src="/assets/idsw-logo.png"
                className="h-8 w-auto"
                alt="IDSW 2026"
              />
            </a>
            <label
              htmlFor="nav-toggle"
              className="site-nav-toggle relative z-10 inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg text-white md:hidden"
              aria-controls="site-nav-panel"
            >
              <span className="sr-only">Menu</span>
              <svg
                className="site-nav-icon-open h-6 w-6"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <path d="M4 6h16M4 12h16M4 18h16"></path>
              </svg>
              <svg
                className="site-nav-icon-close h-6 w-6"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <path d="M6 6l12 12M18 6 6 18"></path>
              </svg>
            </label>
            <ul className="hidden items-center gap-1 md:flex">
              <li>
                <a
                  href="https://www.idsw.dev/"
                  className="site-nav-link inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium text-white/90 transition-colors hover:bg-white/10 hover:text-white"
                >
                  Home
                </a>
              </li>
              <li>
                <a
                  href="https://www.idsw.dev/#keynote-speakers"
                  className="site-nav-link inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium text-white/90 transition-colors hover:bg-white/10 hover:text-white"
                >
                  Speakers
                </a>
              </li>
              <li>
                <a
                  href="https://www.idsw.dev/#cfp"
                  className="site-nav-link inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium text-white/90 transition-colors hover:bg-white/10 hover:text-white"
                >
                  CFP
                </a>
              </li>
              <li>
                <a
                  href="https://www.idsw.dev/#sponsors"
                  className="site-nav-link inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium text-white/90 transition-colors hover:bg-white/10 hover:text-white"
                >
                  Sponsors
                </a>
              </li>
              <li>
                <a
                  href="https://www.idsw.dev/#previous-events"
                  className="site-nav-link inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium text-white/90 transition-colors hover:bg-white/10 hover:text-white"
                >
                  Previous Events
                </a>
              </li>
              <li>
                <a
                  href="https://www.idsw.dev/#faq"
                  className="site-nav-link inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium text-white/90 transition-colors hover:bg-white/10 hover:text-white"
                >
                  FAQ
                </a>
              </li>
              <li>
                <a
                  href="https://www.idsw.dev/#contact"
                  className="site-nav-link inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium text-white/90 transition-colors hover:bg-white/10 hover:text-white"
                >
                  Contact
                </a>
              </li>
              <li>
                <a
                  href="https://tiptip.id/event/68c1a321-c6f7-4fe8-8ac0-38b48136ff33"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="site-nav-link inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium text-white/90 transition-colors hover:bg-white/10 hover:text-white"
                >
                  Tickets
                  <svg
                    className="h-3.5 w-3.5 opacity-70"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M8 8h8v8M8 16 16 8"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    ></path>
                  </svg>
                </a>
              </li>
            </ul>
          </div>
          <div
            id="site-nav-panel"
            className="site-nav-panel mt-4 border-t border-white/10 pt-4"
          >
            <ul className="flex flex-col">
              <li className="w-full">
                <a
                  href="https://www.idsw.dev/"
                  className="site-nav-link flex w-full items-center justify-between gap-3 rounded-lg px-3 py-3 text-base font-medium text-white/90 transition-colors hover:bg-white/10 hover:text-white"
                >
                  Home
                </a>
              </li>
              <li className="w-full">
                <a
                  href="https://www.idsw.dev/#keynote-speakers"
                  className="site-nav-link flex w-full items-center justify-between gap-3 rounded-lg px-3 py-3 text-base font-medium text-white/90 transition-colors hover:bg-white/10 hover:text-white"
                >
                  Speakers
                </a>
              </li>
              <li className="w-full">
                <a
                  href="https://www.idsw.dev/#cfp"
                  className="site-nav-link flex w-full items-center justify-between gap-3 rounded-lg px-3 py-3 text-base font-medium text-white/90 transition-colors hover:bg-white/10 hover:text-white"
                >
                  CFP
                </a>
              </li>
              <li className="w-full">
                <a
                  href="https://www.idsw.dev/#sponsors"
                  className="site-nav-link flex w-full items-center justify-between gap-3 rounded-lg px-3 py-3 text-base font-medium text-white/90 transition-colors hover:bg-white/10 hover:text-white"
                >
                  Sponsors
                </a>
              </li>
              <li className="w-full">
                <a
                  href="https://www.idsw.dev/#previous-events"
                  className="site-nav-link flex w-full items-center justify-between gap-3 rounded-lg px-3 py-3 text-base font-medium text-white/90 transition-colors hover:bg-white/10 hover:text-white"
                >
                  Previous Events
                </a>
              </li>
              <li className="w-full">
                <a
                  href="https://www.idsw.dev/#faq"
                  className="site-nav-link flex w-full items-center justify-between gap-3 rounded-lg px-3 py-3 text-base font-medium text-white/90 transition-colors hover:bg-white/10 hover:text-white"
                >
                  FAQ
                </a>
              </li>
              <li className="w-full">
                <a
                  href="https://www.idsw.dev/#contact"
                  className="site-nav-link flex w-full items-center justify-between gap-3 rounded-lg px-3 py-3 text-base font-medium text-white/90 transition-colors hover:bg-white/10 hover:text-white"
                >
                  Contact
                </a>
              </li>
              <li className="w-full">
                <a
                  href="https://tiptip.id/event/68c1a321-c6f7-4fe8-8ac0-38b48136ff33"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="site-nav-link flex w-full items-center justify-between gap-3 rounded-lg px-3 py-3 text-base font-medium text-white/90 transition-colors hover:bg-white/10 hover:text-white"
                >
                  Tickets
                  <svg
                    className="h-4 w-4 shrink-0 opacity-70"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M8 8h8v8M8 16 16 8"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    ></path>
                  </svg>
                </a>
              </li>
            </ul>
          </div>
        </div>
      </nav>
      <HeaderBehavior />
    </header>
  );
}
