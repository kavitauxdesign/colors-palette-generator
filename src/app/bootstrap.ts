import AppRegistry from "../shared/services/registry";

export function initializeRegisteredApps() {
  const registeredApps = AppRegistry.list();

  registeredApps.forEach((app) => {
    if (typeof app?.initialize !== "function") {
      return;
    }

    app.initialize();
  });
}

export default initializeRegisteredApps;
