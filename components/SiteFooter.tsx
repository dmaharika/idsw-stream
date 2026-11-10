import Image from "next/image";

export default function SiteFooter() {
  return (
    <footer className="footer-gradient text-white">
      <div className="container-site py-16 md:py-20">
        <div className="footer-overview">
          <div className="min-w-0 flex-1">
            <p className="font-display text-2xl font-semibold md:text-3xl">
              IDSW 2026
            </p>
            <p className="mt-2 text-white/80">
              21–22 Nov 2026
            </p>
            <a
              href="https://maps.google.com/?q=Usmar+Ismail+Hall+Jakarta"
              target="_blank"
              rel="noopener noreferrer"
              className="venue-link mt-1 inline-block text-white/70"
            >
              Usmar Ismail Hall, Jakarta Selatan
            </a>
            <dl className="footer-event-days">
              <dt>Day 1</dt>
              <dd>08.00–18.15 WIB</dd>
              <dt>Day 2</dt>
              <dd>09.00–18.15 WIB</dd>
            </dl>
          </div>
          <div className="footer-marks">
            <Image
              width={264}
              height={120}
              unoptimized
              loading="eager"
              src="/assets/idsw-logo.png"
              alt="IDSW 2026"
              className="h-14 w-auto opacity-95 sm:h-16 md:h-20"
            />
            <a
              href="https://perkodi.org"
              target="_blank"
              rel="noopener noreferrer"
              title="Perkumpulan Pengrajin Kode Indonesia"
              className="footer-organizer"
            >
              <span>Organized by</span>
              <Image
                src="/assets/perkodi-logo-white.svg"
                width={460}
                height={89}
                unoptimized
                alt="PERKODI"
                className="footer-organizer-logo"
              />
            </a>
          </div>
        </div>
      </div>
      <div id="contact" className="border-t border-white/10">
        <div className="container-site py-10">
          <div className="flex flex-row flex-wrap items-center justify-between gap-6">
            <div className="min-w-0">
              <h2 className="text-lg font-semibold">Updates & Questions</h2>
              <p className="mt-1 text-sm text-white/70">
                Follow us for news.
              </p>
            </div>
            <ul className="flex flex-wrap gap-3">
              <li>
                <a
                  href="https://x.com/idswdev"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-12 w-12 items-center justify-center rounded-lg border border-white/20 bg-white/10 transition-colors hover:bg-white/20"
                  title="X"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    className="h-5 w-5"
                  >
                    <title>X</title>
                    <path d="M14.234 10.162 22.977 0h-2.072l-7.591 8.824L7.251 0H.258l9.168 13.343L.258 24H2.33l8.016-9.318L16.749 24h6.993zm-2.837 3.299-.929-1.329L3.076 1.56h3.182l5.965 8.532.929 1.329 7.754 11.09h-3.182z"></path>
                  </svg>
                </a>
              </li>
              <li>
                <a
                  href="https://www.instagram.com/idsw.dev"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-12 w-12 items-center justify-center rounded-lg border border-white/20 bg-white/10 transition-colors hover:bg-white/20"
                  title="Instagram"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    className="h-5 w-5"
                  >
                    <title>Instagram</title>
                    <path d="M7.0301.084c-1.2768.0602-2.1487.264-2.911.5634-.7888.3075-1.4575.72-2.1228 1.3877-.6652.6677-1.075 1.3368-1.3802 2.127-.2954.7638-.4956 1.6365-.552 2.914-.0564 1.2775-.0689 1.6882-.0626 4.947.0062 3.2586.0206 3.6671.0825 4.9473.061 1.2765.264 2.1482.5635 2.9107.308.7889.72 1.4573 1.388 2.1228.6679.6655 1.3365 1.0743 2.1285 1.38.7632.295 1.6361.4961 2.9134.552 1.2773.056 1.6884.069 4.9462.0627 3.2578-.0062 3.668-.0207 4.9478-.0814 1.28-.0607 2.147-.2652 2.9098-.5633.7889-.3086 1.4578-.72 2.1228-1.3881.665-.6682 1.0745-1.3378 1.3795-2.1284.2957-.7632.4966-1.636.552-2.9124.056-1.2809.0692-1.6898.063-4.948-.0063-3.2583-.021-3.6668-.0817-4.9465-.0607-1.2797-.264-2.1487-.5633-2.9117-.3084-.7889-.72-1.4568-1.3876-2.1228C21.2982 1.33 20.628.9208 19.8378.6165 19.074.321 18.2017.1197 16.9244.0645 15.6471.0093 15.236-.005 11.977.0014 8.718.0076 8.31.0215 7.0301.0839m.1402 21.6932c-1.17-.0509-1.8053-.2453-2.2287-.408-.5606-.216-.96-.4771-1.3819-.895-.422-.4178-.6811-.8186-.9-1.378-.1644-.4234-.3624-1.058-.4171-2.228-.0595-1.2645-.072-1.6442-.079-4.848-.007-3.2037.0053-3.583.0607-4.848.05-1.169.2456-1.805.408-2.2282.216-.5613.4762-.96.895-1.3816.4188-.4217.8184-.6814 1.3783-.9003.423-.1651 1.0575-.3614 2.227-.4171 1.2655-.06 1.6447-.072 4.848-.079 3.2033-.007 3.5835.005 4.8495.0608 1.169.0508 1.8053.2445 2.228.408.5608.216.96.4754 1.3816.895.4217.4194.6816.8176.9005 1.3787.1653.4217.3617 1.056.4169 2.2263.0602 1.2655.0739 1.645.0796 4.848.0058 3.203-.0055 3.5834-.061 4.848-.051 1.17-.245 1.8055-.408 2.2294-.216.5604-.4763.96-.8954 1.3814-.419.4215-.8181.6811-1.3783.9-.4224.1649-1.0577.3617-2.2262.4174-1.2656.0595-1.6448.072-4.8493.079-3.2045.007-3.5825-.006-4.848-.0608M16.953 5.5864A1.44 1.44 0 1 0 18.39 4.144a1.44 1.44 0 0 0-1.437 1.4424M5.8385 12.012c.0067 3.4032 2.7706 6.1557 6.173 6.1493 3.4026-.0065 6.157-2.7701 6.1506-6.1733-.0065-3.4032-2.771-6.1565-6.174-6.1498-3.403.0067-6.156 2.771-6.1496 6.1738M8 12.0077a4 4 0 1 1 4.008 3.9921A3.9996 3.9996 0 0 1 8 12.0077"></path>
                  </svg>
                </a>
              </li>
              <li>
                <a
                  href="https://www.threads.net/@idsw.dev"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-12 w-12 items-center justify-center rounded-lg border border-white/20 bg-white/10 transition-colors hover:bg-white/20"
                  title="Threads"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    className="h-5 w-5"
                  >
                    <title>Threads</title>
                    <path d="M18.263 11.097c-.03-3.486-1.92-5.586-5.111-5.586-2.13 0-3.922.963-4.863 2.499l2.062 1.438c.535-.843 1.272-1.543 2.628-1.543 1.528 0 2.318.85 2.544 2.431a15 15 0 0 0-2.236-.173c-4.125 0-6.068 1.867-6.068 4.336s1.943 3.99 4.804 3.99c3.139 0 5.013-2.115 5.781-4.735.798.361 1.348 1.204 1.348 2.47 0 3.387-3.907 5.232-7.22 5.232-4.885 0-8.077-3.207-8.077-8.424 0-6.392 4.223-10.487 9.9-10.487 3.808 0 5.69 1.671 6.97 3.914l2.108-1.475C21.44 2.078 18.331 0 13.663 0 6.227 0 1.168 5.277 1.168 12.934c0 7 4.953 11.066 10.856 11.066 4.878 0 9.809-2.846 9.809-7.716 0-2.545-1.46-4.231-3.569-5.187m-6.33 4.855c-1.077 0-2.026-.512-2.026-1.453 0-1.483 1.822-1.934 3.606-1.934.678 0 1.34.045 1.927.173-.422 1.927-1.671 3.215-3.508 3.214Z"></path>
                  </svg>
                </a>
              </li>
              <li>
                <a
                  href="https://www.facebook.com/idsw.dev/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-12 w-12 items-center justify-center rounded-lg border border-white/20 bg-white/10 transition-colors hover:bg-white/20"
                  title="Facebook"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    className="h-5 w-5"
                  >
                    <title>Facebook</title>
                    <path d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647Z"></path>
                  </svg>
                </a>
              </li>
              <li>
                <a
                  href="mailto:idsw.ticketing@perkodi.org"
                  className="flex h-12 w-12 items-center justify-center rounded-lg border border-white/20 bg-white/10 transition-colors hover:bg-white/20"
                  title="Email"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="lucide lucide-mail h-5 w-5"
                    aria-hidden="true"
                  >
                    <path d="m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7"></path>
                    <rect x="2" y="4" width="20" height="16" rx="2"></rect>
                  </svg>
                </a>
              </li>
            </ul>
          </div>
          <div className="footer-navigation mt-8 border-t border-white/10 pt-6 text-xs text-white/60 sm:text-sm">
            <a
              href="https://idsw.dev/"
              className="transition-colors hover:text-white"
            >
              Home{" "}
            </a>
            <a
              href="https://idsw.dev/#keynote-speakers"
              className="transition-colors hover:text-white"
            >
              Speakers{" "}
            </a>
            <a
              href="https://idsw.dev/#schedule"
              className="transition-colors hover:text-white"
            >
              Schedule{" "}
            </a>
            <a
              href="https://idsw.dev/#cfp"
              className="transition-colors hover:text-white"
            >
              CFP{" "}
            </a>
            <a
              href="https://idsw.dev/#sponsors"
              className="transition-colors hover:text-white"
            >
              Sponsors{" "}
            </a>
            <a
              href="https://idsw.dev/#previous-events"
              className="transition-colors hover:text-white"
            >
              Previous Events{" "}
            </a>
            <a
              href="https://idsw.dev/#faq"
              className="transition-colors hover:text-white"
            >
              FAQ{" "}
            </a>
            <a
              href="https://idsw.dev/#contact"
              className="transition-colors hover:text-white"
            >
              Contact{" "}
            </a>
            <a
              href="https://tiptip.id/event/68c1a321-c6f7-4fe8-8ac0-38b48136ff33"
              className="transition-colors hover:text-white"
              target="_blank"
              rel="noopener noreferrer"
            >
              Tickets
            </a>
          </div>
          <div className="footer-legal mt-6 flex flex-wrap items-center border-t border-white/10 pt-6 text-xs text-white/50">
            <a
              href="https://idsw.dev/code-of-conduct"
              className="transition-colors hover:text-white"
            >
              Code of Conduct
            </a>
            <a
              href="https://idsw.dev/terms-of-service"
              className="transition-colors hover:text-white"
            >
              Terms of Service
            </a>
            <a
              href="https://idsw.dev/privacy-policy"
              className="transition-colors hover:text-white"
            >
              Privacy Policy
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
