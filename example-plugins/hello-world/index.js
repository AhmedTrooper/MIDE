// MIDE Plugin API - Available in worker context
let pluginAPI;

// Plugin activation
self.onmessage = function (e) {
  const { type, data } = e.data;

  if (type === "activate") {
    pluginAPI = createAPI();
    activate();
  } else if (type === "executeCommand") {
    executeCommand(data.commandId, ...data.args);
  }
};

// Create API wrapper for async calls to main thread
function createAPI() {
  const pendingCalls = new Map();
  let callIdCounter = 0;

  self.addEventListener("message", (e) => {
    const { type, callId, result, error } = e.data;
    if (type === "apiResponse" || type === "apiError") {
      const pending = pendingCalls.get(callId);
      if (pending) {
        if (type === "apiResponse") {
          pending.resolve(result);
        } else {
          pending.reject(new Error(error));
        }
        pendingCalls.delete(callId);
      }
    }
  });

  function callAPI(method, ...args) {
    return new Promise((resolve, reject) => {
      const callId = callIdCounter++;
      pendingCalls.set(callId, { resolve, reject });
      self.postMessage({
        type: "apiCall",
        data: { method, args, callId },
      });
    });
  }

  return {
    executeCommand: (commandId, ...args) =>
      callAPI("executeCommand", commandId, ...args),
    showMessage: (message, type = "info") =>
      callAPI("showMessage", message, type),
    getActiveFile: () => callAPI("getActiveFile"),
    getWorkspacePath: () => callAPI("getWorkspacePath"),
    readFile: (path) => callAPI("readFile", path),
    writeFile: (path, content) => callAPI("writeFile", path, content),
  };
}

// Register a command
function registerCommand(commandId, handler) {
  self.postMessage({
    type: "registerCommand",
    data: { commandId, handler: handler.toString() },
  });
}

// Execute command handler
function executeCommand(commandId, ...args) {
  if (commandId === "hello-world.sayHello") {
    sayHello();
  } else if (commandId === "hello-world.countLines") {
    countLines();
  }
}

// Plugin activation function
function activate() {
  console.log("Hello World plugin activated!");

  // Register commands
  registerCommand("hello-world.sayHello", sayHello);
  registerCommand("hello-world.countLines", countLines);

  // Show activation message
  pluginAPI.showMessage("Hello World plugin is now active!", "info");
}

// Command: Say Hello
async function sayHello() {
  const workspacePath = await pluginAPI.getWorkspacePath();
  const message = workspacePath
    ? `Hello from MIDE! Workspace: ${workspacePath}`
    : "Hello from MIDE!";

  await pluginAPI.showMessage(message, "info");
}

// Command: Count Lines
async function countLines() {
  try {
    const activeFile = await pluginAPI.getActiveFile();
    if (!activeFile) {
      await pluginAPI.showMessage("No active file", "warning");
      return;
    }

    const content = await pluginAPI.readFile(activeFile);
    const lineCount = content.split("\n").length;

    await pluginAPI.showMessage(
      `Active file has ${lineCount} line${lineCount !== 1 ? "s" : ""}`,
      "info"
    );
  } catch (error) {
    await pluginAPI.showMessage(`Error: ${error.message}`, "error");
  }
}

// Log that the plugin script has loaded
console.log("Hello World plugin script loaded");
