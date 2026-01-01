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
    getOpenFiles: () => callAPI("getOpenFiles"),
    readFile: (path) => callAPI("readFile", path),
    setStatusBarMessage: (message, timeout) =>
      callAPI("setStatusBarMessage", message, timeout),
  };
}

function registerCommand(commandId) {
  self.postMessage({ type: "registerCommand", data: { commandId } });
}

function executeCommand(commandId) {
  if (commandId === "file-analyzer.analyzeFile") {
    analyzeFile();
  } else if (commandId === "file-analyzer.compareFiles") {
    compareFiles();
  }
}

function activate() {
  registerCommand("file-analyzer.analyzeFile");
  registerCommand("file-analyzer.compareFiles");
  pluginAPI.showMessage("File Analyzer plugin activated!", "info");
}

async function analyzeFile() {
  try {
    const activeFile = await pluginAPI.getActiveFile();
    if (!activeFile) {
      await pluginAPI.showMessage("No active file", "warning");
      return;
    }

    const content = await pluginAPI.readFile(activeFile);
    const analysis = getFileAnalysis(content, activeFile);

    const message = `📁 File Analysis: ${analysis.name}
Size: ${analysis.sizeFormatted}
Lines: ${analysis.lines}
Type: ${analysis.type}
Compression: ${analysis.compressionRatio}% potential savings
Empty lines: ${analysis.emptyLines}
Max line length: ${analysis.maxLineLength} chars`;

    await pluginAPI.showMessage(message, "info");
    await pluginAPI.setStatusBarMessage(
      `${analysis.sizeFormatted} | ${analysis.lines} lines`,
      5000
    );
  } catch (error) {
    await pluginAPI.showMessage(`Error: ${error.message}`, "error");
  }
}

async function compareFiles() {
  try {
    const openFiles = await pluginAPI.getOpenFiles();
    if (openFiles.length < 2) {
      await pluginAPI.showMessage(
        "Open at least 2 files to compare",
        "warning"
      );
      return;
    }

    const analyses = [];
    for (const file of openFiles.slice(0, 5)) {
      // Limit to 5 files
      const content = await pluginAPI.readFile(file);
      analyses.push(getFileAnalysis(content, file));
    }

    analyses.sort((a, b) => b.size - a.size);

    let message = "📊 File Comparison (by size):\n";
    analyses.forEach((a, i) => {
      message += `${i + 1}. ${a.name}: ${a.sizeFormatted} (${a.lines} lines)\n`;
    });
    message += `\nTotal: ${formatBytes(
      analyses.reduce((sum, a) => sum + a.size, 0)
    )}`;

    await pluginAPI.showMessage(message, "info");
  } catch (error) {
    await pluginAPI.showMessage(`Error: ${error.message}`, "error");
  }
}

function getFileAnalysis(content, filePath) {
  const name = filePath.split(/[/\\]/).pop();
  const extension = name.split(".").pop().toLowerCase();
  const size = new Blob([content]).size;
  const lines = content.split("\n");
  const emptyLines = lines.filter((l) => l.trim() === "").length;
  const maxLineLength = Math.max(...lines.map((l) => l.length), 0);

  // Estimate compression ratio (very rough estimate)
  const compressedSize = new Blob([content]).size * 0.4; // Rough estimate
  const compressionRatio = Math.round((1 - compressedSize / size) * 100);

  return {
    name,
    size,
    sizeFormatted: formatBytes(size),
    lines: lines.length,
    emptyLines,
    maxLineLength,
    type: getFileType(extension),
    compressionRatio,
  };
}

function formatBytes(bytes) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
}

function getFileType(ext) {
  const types = {
    js: "JavaScript",
    ts: "TypeScript",
    jsx: "React",
    tsx: "React TypeScript",
    py: "Python",
    rs: "Rust",
    java: "Java",
    cpp: "C++",
    c: "C",
    go: "Go",
    rb: "Ruby",
    php: "PHP",
    html: "HTML",
    css: "CSS",
    json: "JSON",
    md: "Markdown",
  };
  return types[ext] || ext.toUpperCase();
}
