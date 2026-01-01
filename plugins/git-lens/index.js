let pluginAPI;

function activate(api) {
  pluginAPI = api;

  pluginAPI.registerCommand("gitlens.showFileHistory", showFileHistory);
  pluginAPI.registerCommand("gitlens.showLineBlame", showLineBlame);
  pluginAPI.registerCommand("gitlens.compareWithPrevious", compareWithPrevious);
  pluginAPI.registerCommand("gitlens.showFileAuthors", showFileAuthors);

  pluginAPI.showMessage("Git Lens activated", "info");
}

async function showFileHistory() {
  try {
    const filePath = pluginAPI.getActiveFile();
    if (!filePath) {
      pluginAPI.showMessage("No active file", "warning");
      return;
    }

    const workspacePath = pluginAPI.getWorkspacePath();
    if (!workspacePath) {
      pluginAPI.showMessage("No workspace open", "warning");
      return;
    }

    // This would need shell execution capability
    pluginAPI.showMessage(`File History: ${filePath.split("/").pop()}`, "info");
    pluginAPI.showMessage(
      "Would execute: git log --follow --pretty=format:'%h - %an, %ar : %s' " +
        filePath,
      "info"
    );

    // Example output format:
    const exampleHistory = `
Recent Commits:
abc123f - John Doe, 2 hours ago: Fix bug in parser
def456a - Jane Smith, 1 day ago: Add new feature
ghi789b - John Doe, 3 days ago: Initial implementation
    `.trim();

    console.log(exampleHistory);
  } catch (error) {
    pluginAPI.showMessage(`Error: ${error.message}`, "error");
  }
}

async function showLineBlame() {
  try {
    const filePath = pluginAPI.getActiveFile();
    if (!filePath) {
      pluginAPI.showMessage("No active file", "warning");
      return;
    }

    pluginAPI.showMessage("Blame info would appear inline in editor", "info");

    // Example blame data
    const exampleBlame = `
Line Blame Information:
Line 1: John Doe (2 days ago) - Initial commit
Line 5: Jane Smith (1 day ago) - Add error handling  
Line 12: John Doe (5 hours ago) - Fix edge case
    `.trim();

    console.log(exampleBlame);
  } catch (error) {
    pluginAPI.showMessage(`Error: ${error.message}`, "error");
  }
}

async function compareWithPrevious() {
  try {
    const filePath = pluginAPI.getActiveFile();
    if (!filePath) {
      pluginAPI.showMessage("No active file", "warning");
      return;
    }

    const content = pluginAPI.getFileContent(filePath);
    if (!content) {
      pluginAPI.showMessage("Could not read file content", "error");
      return;
    }

    pluginAPI.showMessage("Opening diff view...", "info");
    // Would open a diff view comparing current content with HEAD

    console.log("Diff comparison with previous version");
  } catch (error) {
    pluginAPI.showMessage(`Error: ${error.message}`, "error");
  }
}

async function showFileAuthors() {
  try {
    const filePath = pluginAPI.getActiveFile();
    if (!filePath) {
      pluginAPI.showMessage("No active file", "warning");
      return;
    }

    // Example author statistics
    const authorsInfo = {
      "John Doe": { commits: 15, lines: 342, lastCommit: "2 hours ago" },
      "Jane Smith": { commits: 8, lines: 178, lastCommit: "1 day ago" },
      "Bob Johnson": { commits: 3, lines: 45, lastCommit: "1 week ago" },
    };

    let message = "File Authors:\n";
    Object.entries(authorsInfo).forEach(([author, info]) => {
      message += `\n${author}: ${info.commits} commits, ${info.lines} lines (last: ${info.lastCommit})`;
    });

    console.log(message);
    pluginAPI.showMessage("See console for author statistics", "info");
  } catch (error) {
    pluginAPI.showMessage(`Error: ${error.message}`, "error");
  }
}

function deactivate() {
  // Cleanup
}
