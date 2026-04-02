export async function writeText(text: string) {
  const value = String(text ?? "");

  if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
    try {
      await navigator.clipboard.writeText(value);
      return;
    } catch (error) {
      // Fall back to execCommand when clipboard permissions are blocked.
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

export async function readText() {
  if (navigator.clipboard && typeof navigator.clipboard.readText === "function") {
    try {
      return await navigator.clipboard.readText();
    } catch (error) {
      return "";
    }
  }

  return "";
}

export const AppClipboard = {
  readText,
  writeText,
};

window.AppClipboard = AppClipboard;
window.copyTextToClipboard = writeText;

export default AppClipboard;
