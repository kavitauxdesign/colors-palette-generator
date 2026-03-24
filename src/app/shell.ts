import AppEventBus from "../shared/services/event-bus";

let hasInitializedAppShell = false;

const DEFAULT_VIEW_NAME = "palette_generator";
const VIEW_ENTER_ANIMATION_MS = 380;

export function initializeAppShell() {
  if (hasInitializedAppShell) {
    return window.AppShell;
  }
  const views = Array.from(document.querySelectorAll(".view-tab"));
  const navButtons = Array.from(document.querySelectorAll("nav button"));
  const logoImage = document.querySelector(".logo img") as HTMLElement | null;

  function runTransientAnimationClass(
    element: HTMLElement | null,
    className: string,
    durationMs: number
  ) {
    if (!element) {
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

    const activeView = document.getElementById(resolvedViewName) as HTMLElement | null;
    runTransientAnimationClass(activeView, "is-view-entering", VIEW_ENTER_ANIMATION_MS);

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

  if (logoImage && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
    const rotateLogoOnScroll = () => {
      logoImage.style.setProperty("--scroll-rotate", `${window.scrollY * 0.2}deg`);
    };

    window.addEventListener("scroll", rotateLogoOnScroll, { passive: true });
    rotateLogoOnScroll();
  }

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
