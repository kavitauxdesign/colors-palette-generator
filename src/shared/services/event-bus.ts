type EventListener = (detail?: Record<string, unknown>) => void;

const listenersByEvent = new Map<string, Set<EventListener>>();

export function on(eventName: string, listener: EventListener) {
  if (!listenersByEvent.has(eventName)) {
    listenersByEvent.set(eventName, new Set());
  }

  listenersByEvent.get(eventName)?.add(listener);

  return () => {
    off(eventName, listener);
  };
}

export function off(eventName: string, listener: EventListener) {
  const listeners = listenersByEvent.get(eventName);
  if (!listeners) {
    return;
  }

  listeners.delete(listener);
  if (listeners.size === 0) {
    listenersByEvent.delete(eventName);
  }
}

export function emit(eventName: string, detail: Record<string, unknown> = {}) {
  const listeners = listenersByEvent.get(eventName);
  if (!listeners || listeners.size === 0) {
    return;
  }

  listeners.forEach((listener) => {
    try {
      listener(detail);
    } catch (error) {
      console.error(`AppEventBus listener failed for "${eventName}".`, error);
    }
  });
}

export const AppEventBus = {
  on,
  off,
  emit,
};

window.AppEventBus = AppEventBus;

export default AppEventBus;
