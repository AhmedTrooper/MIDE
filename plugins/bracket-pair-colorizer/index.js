let pluginAPI;
let config = {
  enabled: true,
  colors: ["#ffd700", "#da70d6", "#179fff"],
};

const bracketPairs = [
  { open: "(", close: ")" },
  { open: "[", close: "]" },
  { open: "{", close: "}" },
];

function activate(api) {
  pluginAPI = api;

  pluginAPI.registerCommand("bracketColorizer.toggle", toggleColorization);
  pluginAPI.registerCommand("bracketColorizer.refresh", refreshColors);

  // Listen to file changes and re-colorize
  pluginAPI.onFileChange((path, content) => {
    if (config.enabled) {
      analyzeBrackets(content);
    }
  });

  // Listen to file open
  pluginAPI.onFileOpen((path) => {
    if (config.enabled) {
      const content = pluginAPI.getFileContent(path);
      if (content) {
        analyzeBrackets(content);
      }
    }
  });

  pluginAPI.showMessage("Bracket Colorizer activated", "info");
}

function toggleColorization() {
  config.enabled = !config.enabled;
  const status = config.enabled ? "enabled" : "disabled";
  pluginAPI.showMessage(`Bracket Colorization ${status}`, "info");
}

function refreshColors() {
  const filePath = pluginAPI.getActiveFile();
  if (!filePath) {
    pluginAPI.showMessage("No active file", "warning");
    return;
  }

  const content = pluginAPI.getFileContent(filePath);
  if (content) {
    analyzeBrackets(content);
    pluginAPI.showMessage("Bracket colors refreshed", "info");
  }
}

function analyzeBrackets(content) {
  const lines = content.split("\n");
  const bracketStack = [];
  const matches = [];

  for (let lineNum = 0; lineNum < lines.length; lineNum++) {
    const line = lines[lineNum];

    for (let col = 0; col < line.length; col++) {
      const char = line[col];

      // Check if it's an opening bracket
      const openPair = bracketPairs.find((p) => p.open === char);
      if (openPair) {
        bracketStack.push({
          type: openPair,
          line: lineNum,
          col: col,
          depth: bracketStack.filter((b) => b.type.open === char).length,
        });
        continue;
      }

      // Check if it's a closing bracket
      const closePair = bracketPairs.find((p) => p.close === char);
      if (closePair) {
        // Find matching opening bracket
        for (let i = bracketStack.length - 1; i >= 0; i--) {
          if (bracketStack[i].type.close === char) {
            const opening = bracketStack.splice(i, 1)[0];
            const depth = opening.depth;
            const colorIndex = depth % config.colors.length;

            matches.push({
              opening: { line: opening.line, col: opening.col },
              closing: { line: lineNum, col: col },
              color: config.colors[colorIndex],
              depth: depth,
            });
            break;
          }
        }
      }
    }
  }

  // Log bracket analysis
  if (matches.length > 0) {
    console.log(`Found ${matches.length} bracket pairs:`);
    matches.slice(0, 10).forEach((match) => {
      console.log(
        `  [${match.opening.line}:${match.opening.col}] ↔ [${match.closing.line}:${match.closing.col}]`,
        `(depth: ${match.depth}, color: ${match.color})`
      );
    });

    if (matches.length > 10) {
      console.log(`  ... and ${matches.length - 10} more`);
    }
  }

  // Check for unmatched brackets
  if (bracketStack.length > 0) {
    console.warn(`Found ${bracketStack.length} unmatched opening brackets`);
  }

  return matches;
}

function deactivate() {
  // Cleanup
}
