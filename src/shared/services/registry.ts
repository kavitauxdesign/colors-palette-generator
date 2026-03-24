export interface RegisteredApp {
  id: string;
  initialize?: () => void;
  [key: string]: unknown;
}

const registeredApps = new Map<string, RegisteredApp>();

export function register(id: string, appDefinition: Record<string, unknown> = {}) {
  if (!id || typeof id !== "string") {
    throw new Error("AppRegistry.register requires a string id.");
  }

  const safeDefinition: RegisteredApp = {
    id,
    ...(appDefinition || {}),
  };

  registeredApps.set(id, safeDefinition);
  return safeDefinition;
}

export function get(id: string) {
  return registeredApps.get(id) || null;
}

export function list() {
  return Array.from(registeredApps.values());
}

export const AppRegistry = {
  register,
  get,
  list,
};

window.AppRegistry = AppRegistry;

export default AppRegistry;
