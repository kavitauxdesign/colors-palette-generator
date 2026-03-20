// App bootstrap
// Initialize registered mini-apps once the page is ready.
function initializeRegisteredApps() {
  const registeredApps = window.AppRegistry?.list?.() || [];

  registeredApps.forEach((app) => {
    if (typeof app?.initialize !== "function") {
      return;
    }

    app.initialize();
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeRegisteredApps, { once: true });
} else {
  initializeRegisteredApps();
}
