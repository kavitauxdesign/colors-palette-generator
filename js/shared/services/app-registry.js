// Lightweight registry for mini-apps mounted on the page.
(function initializeAppRegistry() {
  const registeredApps = new Map();

  function register(id, appDefinition) {
    if (!id || typeof id !== "string") {
      throw new Error("AppRegistry.register requires a string id.");
    }

    const safeDefinition = {
      id,
      ...(appDefinition || {}),
    };

    registeredApps.set(id, safeDefinition);
    return safeDefinition;
  }

  function get(id) {
    return registeredApps.get(id) || null;
  }

  function list() {
    return Array.from(registeredApps.values());
  }

  window.AppRegistry = {
    register,
    get,
    list,
  };
})();
