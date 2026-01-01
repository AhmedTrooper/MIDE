let pluginAPI;

self.onmessage = function (e) {
  const { type, data } = e.data;
  if (type === "activate") {
    pluginAPI = createAPI();
    activate();
  } else if (type === "executeCommand") {
    executeCommand(data.commandId, ...data.args);
  }
};

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
      self.postMessage({ type: "apiCall", data: { method, args, callId } });
    });
  }

  return {
    showMessage: (message, type = "info") =>
      callAPI("showMessage", message, type),
    getActiveFile: () => callAPI("getActiveFile"),
    readFile: (path) => callAPI("readFile", path),
    setStatusBarMessage: (message, timeout) =>
      callAPI("setStatusBarMessage", message, timeout),
  };
}

function registerCommand(commandId) {
  self.postMessage({ type: "registerCommand", data: { commandId } });
}

function executeCommand(commandId, ...args) {
  if (commandId === "word-counter.count") {
    countDocument();
  } else if (commandId === "word-counter.countSelection") {
    countSelection(args[0]);
  }
}

function activate() {
  registerCommand("word-counter.count");
  registerCommand("word-counter.countSelection");
  pluginAPI.showMessage("Word Counter plugin activated!", "info");
}

async function countDocument() {
  try {
    const activeFile = await pluginAPI.getActiveFile();
    if (!activeFile) {
      await pluginAPI.showMessage("No active file", "warning");
      return;
    }

    const content = await pluginAPI.readFile(activeFile);
    const stats = analyzeText(content);

    const message = `📊 Document Statistics:
Lines: ${stats.lines}
Words: ${stats.words}
Characters: ${stats.characters}
Characters (no spaces): ${stats.charactersNoSpaces}
Paragraphs: ${stats.paragraphs}
Reading time: ~${stats.readingTime} min`;

    await pluginAPI.showMessage(message, "info");
    await pluginAPI.setStatusBarMessage(
      `${stats.words} words, ${stats.lines} lines`,
      5000
    );
  } catch (error) {
    await pluginAPI.showMessage(`Error: ${error.message}`, "error");
  }
}

async function countSelection(selectedText) {
  if (!selectedText) {
    await pluginAPI.showMessage("No text selected", "warning");
    return;
  }

  const stats = analyzeText(selectedText);
  const message = `📊 Selection Statistics:
Words: ${stats.words}
Characters: ${stats.characters}
Lines: ${stats.lines}`;

  await pluginAPI.showMessage(message, "info");
}

function analyzeText(text) {
  const lines = text.split("\n").length;
  const words = text
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0).length;
  const characters = text.length;
  const charactersNoSpaces = text.replace(/\s/g, "").length;
  const paragraphs = text
    .split(/\n\s*\n/)
    .filter((p) => p.trim().length > 0).length;
  const readingTime = Math.ceil(words / 200); // Average reading speed: 200 words/min

  return {
    lines,
    words,
    characters,
    charactersNoSpaces,
    paragraphs,
    readingTime,
  };
}
