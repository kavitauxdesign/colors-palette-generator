// App bootstrap
// Run startup only when DOM is fully ready and required functions exist.
function initializeApp() {
	if (
		typeof setPaletteSize !== "function" ||
		typeof setTemperatureSelection !== "function" ||
		typeof generatePalette !== "function" ||
		typeof updateAddColorButtonState !== "function"
	) {
		console.error("App initialization failed: required startup functions are missing.");
		return;
	}

	if (typeof setupSurpriseButton === "function") {
		setupSurpriseButton();
	}

	setPaletteSize(paletteSize);
	setTemperatureSelection(temperature);

	void generatePalette();
	updateAddColorButtonState();
}

if (document.readyState === "loading") {
	document.addEventListener("DOMContentLoaded", initializeApp);
} else {
	initializeApp();
}
