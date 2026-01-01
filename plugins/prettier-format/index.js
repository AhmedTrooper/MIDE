let pluginAPI;
let config = {
  tabWidth: 2,
  useTabs: false,
  semi: true,
  singleQuote: false,
  trailingComma: "es5",
};

// Basic formatting rules (simplified prettier-like behavior)
const formatters = {
  javascript: formatJS,
  typescript: formatJS,
  json: formatJSON,
  css: formatCSS,
  html: formatHTML,
};

function activate(api) {
  pluginAPI = api;

  pluginAPI.registerCommand("prettier.formatDocument", formatDocument);
  pluginAPI.registerCommand("prettier.formatSelection", formatSelection);

  pluginAPI.showMessage("Prettier Formatter loaded", "info");
}

async function formatDocument() {
  try {
    const filePath = pluginAPI.getActiveFile();
    if (!filePath) {
      pluginAPI.showMessage("No active file to format", "warning");
      return;
    }

    const content = pluginAPI.getFileContent(filePath);
    if (!content) {
      pluginAPI.showMessage("Could not read file content", "error");
      return;
    }

    const ext = filePath.split(".").pop().toLowerCase();
    const formatter = getFormatterForExtension(ext);

    if (!formatter) {
      pluginAPI.showMessage(
        `No formatter available for .${ext} files`,
        "warning"
      );
      return;
    }

    const formatted = formatter(content);
    await pluginAPI.writeFile(filePath, formatted);
    pluginAPI.showMessage("Document formatted successfully", "info");
  } catch (error) {
    pluginAPI.showMessage(`Formatting failed: ${error.message}`, "error");
  }
}

function formatSelection() {
  pluginAPI.showMessage("Format selection not yet implemented", "info");
}

function getFormatterForExtension(ext) {
  const mapping = {
    js: formatters.javascript,
    jsx: formatters.javascript,
    ts: formatters.typescript,
    tsx: formatters.typescript,
    json: formatters.json,
    css: formatters.css,
    scss: formatters.css,
    html: formatters.html,
    htm: formatters.html,
  };
  return mapping[ext];
}

function formatJS(code) {
  // Basic JS/TS formatting
  let formatted = code;

  // Add semicolons if enabled
  if (config.semi) {
    formatted = formatted.replace(/([^;{}\s])\s*\n/g, "$1;\n");
  }

  // Fix indentation
  const lines = formatted.split("\n");
  let indent = 0;
  const indentStr = config.useTabs ? "\t" : " ".repeat(config.tabWidth);

  formatted = lines
    .map((line) => {
      const trimmed = line.trim();
      if (!trimmed) return "";

      // Decrease indent for closing braces
      if (
        trimmed.startsWith("}") ||
        trimmed.startsWith("]") ||
        trimmed.startsWith(")")
      ) {
        indent = Math.max(0, indent - 1);
      }

      const result = indentStr.repeat(indent) + trimmed;

      // Increase indent for opening braces
      if (
        trimmed.endsWith("{") ||
        trimmed.endsWith("[") ||
        trimmed.endsWith("(")
      ) {
        indent++;
      }

      return result;
    })
    .join("\n");

  // Fix quote style
  if (config.singleQuote) {
    formatted = formatted.replace(/"([^"]*)"/g, "'$1'");
  }

  return formatted;
}

function formatJSON(code) {
  try {
    const parsed = JSON.parse(code);
    return JSON.stringify(parsed, null, config.tabWidth);
  } catch {
    return code; // Return original if invalid JSON
  }
}

function formatCSS(code) {
  // Basic CSS formatting
  let formatted = code
    .replace(/\s*{\s*/g, " {\n")
    .replace(/\s*}\s*/g, "\n}\n")
    .replace(/\s*;\s*/g, ";\n")
    .replace(/\s*,\s*/g, ", ");

  const lines = formatted.split("\n");
  let indent = 0;
  const indentStr = " ".repeat(config.tabWidth);

  formatted = lines
    .map((line) => {
      const trimmed = line.trim();
      if (!trimmed) return "";

      if (trimmed === "}") {
        indent = Math.max(0, indent - 1);
      }

      const result = indentStr.repeat(indent) + trimmed;

      if (trimmed.includes("{")) {
        indent++;
      }

      return result;
    })
    .join("\n");

  return formatted;
}

function formatHTML(code) {
  // Basic HTML formatting
  const lines = code.split("\n");
  let indent = 0;
  const indentStr = " ".repeat(config.tabWidth);
  const selfClosing = ["br", "hr", "img", "input", "meta", "link"];

  let formatted = lines
    .map((line) => {
      const trimmed = line.trim();
      if (!trimmed) return "";

      // Closing tag
      if (trimmed.startsWith("</")) {
        indent = Math.max(0, indent - 1);
      }

      const result = indentStr.repeat(indent) + trimmed;

      // Opening tag (not self-closing)
      if (trimmed.startsWith("<") && !trimmed.startsWith("</")) {
        const tagName = trimmed.match(/<(\w+)/)?.[1];
        if (
          tagName &&
          !selfClosing.includes(tagName) &&
          !trimmed.endsWith("/>")
        ) {
          indent++;
        }
      }

      return result;
    })
    .join("\n");

  return formatted;
}

function deactivate() {
  // Cleanup
}
