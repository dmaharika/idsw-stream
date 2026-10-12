"use client";

import { useEffect } from "react";

/** Enhance the server-rendered header without changing its shared markup. */
export default function HeaderBehavior() {
  useEffect(() => {
    const nav = document.querySelector<HTMLElement>(".site-nav");
    const toggle = document.querySelector<HTMLInputElement>("#nav-toggle");
    const panel = document.querySelector<HTMLElement>(".site-nav-panel");
    if (!nav || !toggle || !panel) return;

    const links = nav.querySelectorAll<HTMLAnchorElement>(".site-nav-link");
    const root = document.documentElement;
    const previousHeight = root.style.getPropertyValue("--site-header-height");
    let frame = 0;

    const setHeaderHeight = () => {
      const panelHeight = toggle.checked
        ? panel.getBoundingClientRect().height
        : 0;
      const height = nav.getBoundingClientRect().height - panelHeight;
      root.style.setProperty("--site-header-height", `${Math.round(height)}px`);
    };
    const scheduleMeasurement = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(setHeaderHeight);
    };
    const syncMenuState = () => {
      toggle.setAttribute("aria-expanded", String(toggle.checked));
      scheduleMeasurement();
    };
    const closeMenu = () => {
      toggle.checked = false;
      syncMenuState();
    };
    const onScroll = () => {
      nav.classList.toggle("is-scrolled", window.scrollY > 24);
      scheduleMeasurement();
    };
    const onTransition = (event: TransitionEvent) => {
      if (event.propertyName.includes("padding")) setHeaderHeight();
    };
    const onResize = () => {
      if (window.innerWidth >= 768) closeMenu();
      scheduleMeasurement();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && toggle.checked) {
        closeMenu();
        toggle.focus();
      }
    };

    onScroll();
    syncMenuState();
    setHeaderHeight();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    document.addEventListener("keydown", onKeyDown);
    nav.addEventListener("transitionend", onTransition);
    toggle.addEventListener("change", syncMenuState);
    links.forEach((link) => link.addEventListener("click", closeMenu));

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("keydown", onKeyDown);
      nav.removeEventListener("transitionend", onTransition);
      toggle.removeEventListener("change", syncMenuState);
      links.forEach((link) => link.removeEventListener("click", closeMenu));
      nav.classList.remove("is-scrolled");
      if (previousHeight)
        root.style.setProperty("--site-header-height", previousHeight);
      else root.style.removeProperty("--site-header-height");
    };
  }, []);

  return null;
}
