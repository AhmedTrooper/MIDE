let pluginAPI;
let config = { enabled: true, delay: 2000 };
let saveTimers = new Map();

function activate(api) {
  pluginAPI = api;

  // Register commands
  pluginAPI.registerCommand("auto-save.toggle", toggleAutoSave);
  pluginAPI.registerCommand("auto-save.setDelay", setDelay);

  // Listen to file changes
  pluginAPI.onFileChange((path, content) => {
    if (!config.enabled) return;

    // Clear existing timer for this file
    if (saveTimers.has(path)) {
      clearTimeout(saveTimers.get(path));
    }

    // Set new timer
    const timerId = setTimeout(async () => {
      try {
        await pluginAPI.writeFile(path, content);
        pluginAPI.showMessage(`Auto-saved: ${path.split("/").pop()}`, "info");
        saveTimers.delete(path);
      } catch (error) {
        pluginAPI.showMessage(`Auto-save failed: ${error.message}`, "error");
      }
    }, config.delay);

    saveTimers.set(path, timerId);
  });

  pluginAPI.showMessage("Auto Save enabled", "info");
}

function toggleAutoSave() {
  config.enabled = !config.enabled;
  const status = config.enabled ? "enabled" : "disabled";
  pluginAPI.showMessage(`Auto Save ${status}`, "info");

  // Clear all pending timers if disabled
  if (!config.enabled) {
    saveTimers.forEach((timerId) => clearTimeout(timerId));
    saveTimers.clear();
  }
}

function setDelay() {
  const newDelay = prompt(
    "Enter auto-save delay in milliseconds:",
    config.delay.toString()
  );
  if (newDelay && !isNaN(newDelay)) {
    config.delay = parseInt(newDelay, 10);
    pluginAPI.showMessage(`Auto Save delay set to ${config.delay}ms`, "info");
  }
}

function deactivate() {
  // Clear all pending timers
  saveTimers.forEach((timerId) => clearTimeout(timerId));
  saveTimers.clear();
}
