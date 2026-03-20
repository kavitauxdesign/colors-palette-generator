// Shared event bus used by mini-apps to communicate without tight coupling.
(function initializeAppEventBus() {
  const listenersByEvent = new Map();

  function on(eventName, listener) {
    if (!listenersByEvent.has(eventName)) {
      listenersByEvent.set(eventName, new Set());
    }

    listenersByEvent.get(eventName).add(listener);

    return () => {
      off(eventName, listener);
    };
  }

  function off(eventName, listener) {
    const listeners = listenersByEvent.get(eventName);
    if (!listeners) {
      return;
    }

    listeners.delete(listener);
    if (listeners.size === 0) {
      listenersByEvent.delete(eventName);
    }
  }

  function emit(eventName, detail = {}) {
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

  window.AppEventBus = {
    on,
    off,
    emit,
  };
})();
