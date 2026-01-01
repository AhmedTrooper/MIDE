let pluginAPI;

self.onmessage = function (e) {
  const { type, data } = e.data;
  if (type === "activate") {
    pluginAPI = createAPI();
    activate();
  } else if (type === "executeCommand") {
    executeCommand(data.commandId);
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
  };
}

function registerCommand(commandId) {
  self.postMessage({ type: "registerCommand", data: { commandId } });
}

function executeCommand(commandId) {
  if (commandId === "todo-highlighter.findAll") {
    findAllTodos();
  } else if (commandId === "todo-highlighter.summary") {
    showSummary();
  }
}

function activate() {
  registerCommand("todo-highlighter.findAll");
  registerCommand("todo-highlighter.summary");
  pluginAPI.showMessage("TODO Highlighter activated!", "info");
}

async function findAllTodos() {
  try {
    const activeFile = await pluginAPI.getActiveFile();
    if (!activeFile) {
      await pluginAPI.showMessage("No active file", "warning");
      return;
    }

    const content = await pluginAPI.readFile(activeFile);
    const todos = findTodos(content);

    if (todos.length === 0) {
      await pluginAPI.showMessage("No TODOs found in this file 🎉", "info");
      return;
    }

    let message = `🔍 Found ${todos.length} TODO${
      todos.length > 1 ? "s" : ""
    }:\n\n`;
    todos.slice(0, 10).forEach((todo) => {
      const icon = getIcon(todo.type);
      message += `${icon} Line ${todo.line}: ${todo.text}\n`;
    });

    if (todos.length > 10) {
      message += `\n... and ${todos.length - 10} more`;
    }

    await pluginAPI.showMessage(message, "info");
  } catch (error) {
    await pluginAPI.showMessage(`Error: ${error.message}`, "error");
  }
}

async function showSummary() {
  try {
    const activeFile = await pluginAPI.getActiveFile();
    if (!activeFile) {
      await pluginAPI.showMessage("No active file", "warning");
      return;
    }

    const content = await pluginAPI.readFile(activeFile);
    const todos = findTodos(content);

    const summary = {
      TODO: todos.filter((t) => t.type === "TODO").length,
      FIXME: todos.filter((t) => t.type === "FIXME").length,
      HACK: todos.filter((t) => t.type === "HACK").length,
      NOTE: todos.filter((t) => t.type === "NOTE").length,
    };

    const message = `📊 TODO Summary:
TODO: ${summary.TODO}
FIXME: ${summary.FIXME}
HACK: ${summary.HACK}
NOTE: ${summary.NOTE}
Total: ${todos.length}`;

    await pluginAPI.showMessage(message, "info");
  } catch (error) {
    await pluginAPI.showMessage(`Error: ${error.message}`, "error");
  }
}

function findTodos(content) {
  const lines = content.split("\n");
  const todos = [];
  const patterns = [
    { regex: /\b(TODO):?\s*(.+?)$/i, type: "TODO" },
    { regex: /\b(FIXME):?\s*(.+?)$/i, type: "FIXME" },
    { regex: /\b(HACK):?\s*(.+?)$/i, type: "HACK" },
    { regex: /\b(NOTE):?\s*(.+?)$/i, type: "NOTE" },
  ];

  lines.forEach((line, index) => {
    for (const pattern of patterns) {
      const match = line.match(pattern.regex);
      if (match) {
        todos.push({
          line: index + 1,
          type: pattern.type,
          text: match[2]?.trim() || match[0],
          fullLine: line.trim(),
        });
        break; // Only match first pattern per line
      }
    }
  });

  return todos;
}

function getIcon(type) {
  const icons = {
    TODO: "📝",
    FIXME: "🐛",
    HACK: "⚠️",
    NOTE: "📌",
  };
  return icons[type] || "•";
}
