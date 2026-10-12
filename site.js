const nav = document.querySelector(".site-nav");
const toggle = document.querySelector("#nav-toggle");
const panel = document.querySelector(".site-nav-panel");
const links = document.querySelectorAll(".site-nav-link");
const setHeaderHeight = () => {
  if (!nav) return;
  const panelHeight =
    toggle?.checked && panel ? panel.getBoundingClientRect().height : 0;
  const height = nav.getBoundingClientRect().height - panelHeight;
  document.documentElement.style.setProperty(
    "--site-header-height",
    `${Math.round(height)}px`,
  );
};
const setScrolled = () => {
  nav?.classList.toggle("is-scrolled", window.scrollY > 24);
  requestAnimationFrame(setHeaderHeight);
};
const setMenuOpen = (open) => {
  if (toggle) toggle.checked = open;
  requestAnimationFrame(setHeaderHeight);
};
setScrolled();
setHeaderHeight();
window.addEventListener("scroll", setScrolled, { passive: true });
nav?.addEventListener("transitionend", (event) => {
  if (
    event instanceof TransitionEvent &&
    event.propertyName.includes("padding")
  ) {
    setHeaderHeight();
  }
});
toggle?.addEventListener("change", () =>
  requestAnimationFrame(setHeaderHeight),
);
links.forEach((link) =>
  link.addEventListener("click", () => setMenuOpen(false)),
);
window.addEventListener("resize", () => {
  if (window.innerWidth >= 768) setMenuOpen(false);
  setHeaderHeight();
});

// Keep the checkbox menu's expanded state available to assistive technology.
const syncMenuState = () =>
  toggle?.setAttribute("aria-expanded", String(toggle.checked));
toggle?.addEventListener("change", syncMenuState);
links.forEach((link) => link.addEventListener("click", syncMenuState));
window.addEventListener("resize", syncMenuState);
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && toggle?.checked) {
    setMenuOpen(false);
    syncMenuState();
    toggle.focus();
  }
});
syncMenuState();
