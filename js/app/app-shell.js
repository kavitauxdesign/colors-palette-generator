// Shared shell for view navigation and cross-app page-level behavior.
(function initializeAppShell() {
  const DEFAULT_VIEW_NAME = "palette_generator";
  const views = Array.from(document.querySelectorAll(".view-tab"));
  const navButtons = Array.from(document.querySelectorAll("nav button"));
  const logoImage = document.querySelector(".logo img");

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

  if (logoImage && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
    const rotateLogoOnScroll = () => {
      logoImage.style.setProperty("--scroll-rotate", `${window.scrollY * 0.2}deg`);
    };

    window.addEventListener("scroll", rotateLogoOnScroll, { passive: true });
    rotateLogoOnScroll();
  }

  window.AppShell = {
    showView,
    getCurrentView() {
      return document.querySelector(".view-tab.active")?.id || DEFAULT_VIEW_NAME;
    },
  };
})();
