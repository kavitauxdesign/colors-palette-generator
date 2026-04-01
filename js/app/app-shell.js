// Shared shell for view navigation and cross-app page-level behavior.
(function initializeAppShell() {
  const DEFAULT_VIEW_NAME = "palette_generator";
  const VIEW_CASCADE_REVEAL_MS = 520;
  const views = Array.from(document.querySelectorAll(".view-tab"));
  const navButtons = Array.from(document.querySelectorAll("nav button"));
  const siteHeader = document.querySelector(".site-header");
  const initialHashViewName = location.hash.replace("#", "");
  const shouldResetInitialHashScroll = views.some((view) => view.id === initialHashViewName);
  let hasCompletedInitialViewSync = false;

  function runTransientAnimationClass(element, className, durationMs) {
    if (!element || matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    if (element.__codexAnimationTimeout) {
      clearTimeout(element.__codexAnimationTimeout);
      element.__codexAnimationTimeout = null;
    }

    element.classList.remove(className);
    void element.offsetWidth;
    element.classList.add(className);

    element.__codexAnimationTimeout = setTimeout(() => {
      element.classList.remove(className);
      element.__codexAnimationTimeout = null;
    }, durationMs);
  }

  function resolveViewName(name) {
    const normalizedName = String(name ?? "").trim();
    const hasMatchingView = views.some((view) => view.id === normalizedName);
    return hasMatchingView ? normalizedName : DEFAULT_VIEW_NAME;
  }

  function updateActiveMenuButton(view) {
    navButtons.forEach((button) => {
      button.classList.toggle("active", button.dataset.view === view);
    });
  }

  function showView(name, metadata = {}) {
    const resolvedViewName = resolveViewName(name);

    views.forEach((view) => {
      view.classList.toggle("active", view.id === resolvedViewName);
    });

    updateActiveMenuButton(resolvedViewName);
    window.AppEventBus?.emit("app:view-changed", {
      view: resolvedViewName,
      metadata,
    });

    const shouldAnimateViewChange =
      hasCompletedInitialViewSync &&
      (metadata.source === "nav" || metadata.source === "location");

    if (shouldAnimateViewChange) {
      runTransientAnimationClass(
        document.getElementById(resolvedViewName),
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
      if (!button.dataset.view) {
        return;
      }

      const targetView = showView(button.dataset.view, {
        source: "nav",
      });
      history.replaceState(null, "", `#${targetView}`);
      window.scrollTo({ top: 0, behavior: "auto" });
    });
  });

  window.addEventListener("hashchange", syncViewFromLocation);

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", syncViewFromLocation, { once: true });
  } else {
    syncViewFromLocation();
  }
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

  window.AppShell = {
    showView,
    getCurrentView() {
      return document.querySelector(".view-tab.active")?.id || DEFAULT_VIEW_NAME;
    },
  };
})();
