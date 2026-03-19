// Shared clipboard service for all mini-apps.
(function initializeClipboardService() {
  async function writeText(text) {
    const value = String(text ?? "");

    if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
      try {
        await navigator.clipboard.writeText(value);
        return;
      } catch (error) {
        // Fallback to execCommand if clipboard API is blocked.
      }
    }

    const textArea = document.createElement("textarea");
    textArea.value = value;
    textArea.style.position = "fixed";
    textArea.style.left = "-9999px";
    textArea.style.top = "0";
    textArea.style.opacity = "0";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    const didCopy = document.execCommand("copy");
    textArea.remove();

    if (!didCopy) {
      throw new Error("Clipboard copy failed");
    }
  }

  window.AppClipboard = {
    writeText,
  };

  // Keep backward compatibility with the existing helper name.
  window.copyTextToClipboard = writeText;
})();
