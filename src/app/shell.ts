import AppEventBus from "../shared/services/event-bus";

let hasInitializedAppShell = false;

const DEFAULT_VIEW_NAME = "palette_generator";
const VIEW_CASCADE_REVEAL_MS = 520;

export function initializeAppShell() {
  if (hasInitializedAppShell) {
    return window.AppShell;
  }
  const views = Array.from(document.querySelectorAll(".view-tab"));
  const navButtons = Array.from(document.querySelectorAll(".site-nav-button"));
  const siteHeader = document.querySelector(".site-header");
  const initialHashViewName = location.hash.replace("#", "");
  const shouldResetInitialHashScroll = views.some((view) => view.id === initialHashViewName);
  let hasCompletedInitialViewSync = false;

  function runTransientAnimationClass(
    element: HTMLElement | null,
    className: string,
    durationMs: number
  ) {
    if (!element || matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const animatedElement = element as HTMLElement & {
      __codexAnimationTimeout?: ReturnType<typeof setTimeout> | null;
    };

    if (animatedElement.__codexAnimationTimeout) {
      clearTimeout(animatedElement.__codexAnimationTimeout);
      animatedElement.__codexAnimationTimeout = null;
    }

    element.classList.remove(className);
    void element.offsetWidth;
    element.classList.add(className);

    animatedElement.__codexAnimationTimeout = setTimeout(() => {
      element.classList.remove(className);
      animatedElement.__codexAnimationTimeout = null;
    }, durationMs);
  }

  function resolveViewName(name: string) {
    const normalizedName = String(name ?? "").trim();
    const hasMatchingView = views.some((view) => view.id === normalizedName);
    return hasMatchingView ? normalizedName : DEFAULT_VIEW_NAME;
  }

  function updateActiveMenuButton(view: string) {
    navButtons.forEach((button) => {
      button.classList.toggle("active", button.getAttribute("data-view") === view);
    });
  }

  function showView(name: string, metadata: Record<string, unknown> = {}) {
    const resolvedViewName = resolveViewName(name);

    views.forEach((view) => {
      view.classList.toggle("active", view.id === resolvedViewName);
    });

    updateActiveMenuButton(resolvedViewName);
    AppEventBus.emit("app:view-changed", {
      view: resolvedViewName,
      metadata,
    });

    const shouldAnimateViewChange =
      hasCompletedInitialViewSync &&
      (metadata.source === "nav" || metadata.source === "location");

    if (shouldAnimateViewChange) {
      runTransientAnimationClass(
        document.getElementById(resolvedViewName) as HTMLElement | null,
        "is-view-cascade-revealing",
        VIEW_CASCADE_REVEAL_MS
      );
    }

    return resolvedViewName;
  }

  function syncViewFromLocation() {
    return showView(location.hash.replace("#", ""), {
      source: "location",
    });
  }

  navButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const targetView = button.getAttribute("data-view");
      if (!targetView) {
        return;
      }

      const resolvedTargetView = showView(targetView, {
        source: "nav",
      });
      history.replaceState(null, "", `#${resolvedTargetView}`);
      window.scrollTo({ top: 0, behavior: "auto" });
    });
  });

  window.addEventListener("hashchange", syncViewFromLocation);
  syncViewFromLocation();
  hasCompletedInitialViewSync = true;

  if (shouldResetInitialHashScroll) {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      });
    });
  }

  function syncHeaderShadow() {
    siteHeader?.classList.toggle("is-scrolled", window.scrollY > 0);
  }

  window.addEventListener("scroll", syncHeaderShadow, { passive: true });
  syncHeaderShadow();

  const appShell = {
    showView,
    getCurrentView() {
      return document.querySelector(".view-tab.active")?.id || DEFAULT_VIEW_NAME;
    },
  };

  window.AppShell = appShell;
  hasInitializedAppShell = true;
  return appShell;
}

export default initializeAppShell;
