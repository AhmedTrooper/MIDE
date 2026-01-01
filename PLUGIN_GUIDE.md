# MIDE Plugin Development Guide

## Overview

MIDE features a powerful, VSCode-competitive plugin system that allows you to extend the IDE's functionality with custom features, commands, and integrations. Plugins run in isolated Web Workers for security and performance.

## Quick Start

### 1. Plugin Structure

```
~/.mide/plugins/my-plugin/
├── plugin.json     # Plugin manifest
└── index.js        # Plugin code
```

### 2. Basic Plugin Example

**plugin.json:**

```json
{
  "id": "mide.my-plugin",
  "name": "My Plugin",
  "version": "1.0.0",
  "description": "Does something awesome",
  "author": "Your Name",
  "type": "js",
  "main": "index.js",
  "activation_events": ["*"],
  "contributes": {
    "commands": [
      {
        "id": "my-plugin.hello",
        "title": "Say Hello"
      }
    ]
  },
  "permissions": ["editor:read"]
}
```

**index.js:**

```javascript
let pluginAPI;

function activate(api) {
  pluginAPI = api;

  // Register command
  pluginAPI.registerCommand("my-plugin.hello", helloCommand);

  pluginAPI.showMessage("My Plugin activated!", "info");
}

async function helloCommand() {
  const file = pluginAPI.getActiveFile();
  pluginAPI.showMessage(`Hello from ${file}!`, "info");
}

function deactivate() {
  // Cleanup
}
```

## Plugin API Reference

### Core Methods

#### `registerCommand(commandId, handler)`

Register a command that users can execute.

```javascript
pluginAPI.registerCommand("my-plugin.format", async () => {
  const content = pluginAPI.getFileContent(pluginAPI.getActiveFile());
  // Format content...
});
```

#### `executeCommand(commandId, ...args)`

Execute a registered command.

```javascript
await pluginAPI.executeCommand("other-plugin.doSomething", arg1, arg2);
```

### UI Methods

#### `showMessage(message, type)`

Display a message to the user.

- Types: `'info' | 'warning' | 'error'`

```javascript
pluginAPI.showMessage("Task completed!", "info");
pluginAPI.showMessage("Warning: File too large", "warning");
pluginAPI.showMessage("Error: Invalid syntax", "error");
```

#### `setStatusBarMessage(message, timeout?)`

Show a message in the status bar.

```javascript
pluginAPI.setStatusBarMessage("Processing...");
pluginAPI.setStatusBarMessage("Done!", 3000); // Auto-clear after 3s
```

### Editor Methods

#### `getActiveFile()`

Get the path of the currently active file.

```javascript
const filePath = pluginAPI.getActiveFile();
// Returns: "/path/to/file.ts" or null
```

#### `getOpenFiles()`

Get paths of all open files.

```javascript
const openFiles = pluginAPI.getOpenFiles();
// Returns: ["/path/to/file1.ts", "/path/to/file2.js"]
```

#### `getFileContent(path)`

Get the content of an open file.

```javascript
const content = pluginAPI.getFileContent("/path/to/file.ts");
```

#### `getWorkspacePath()`

Get the root workspace directory.

```javascript
const workspace = pluginAPI.getWorkspacePath();
// Returns: "/home/user/project"
```

### File System Methods

#### `readFile(path)`

Read a file from disk.

```javascript
const content = await pluginAPI.readFile("/path/to/file.txt");
```

#### `writeFile(path, content)`

Write content to a file.

```javascript
await pluginAPI.writeFile("/path/to/file.txt", "Hello, World!");
```

### Event Listeners

#### `onFileOpen(callback)`

Listen for file open events.

```javascript
pluginAPI.onFileOpen((path) => {
  console.log(`File opened: ${path}`);
});
```

#### `onFileSave(callback)`

Listen for file save events.

```javascript
pluginAPI.onFileSave((path) => {
  console.log(`File saved: ${path}`);
  // Run formatter, linter, etc.
});
```

#### `onFileChange(callback)`

Listen for file content changes.

```javascript
pluginAPI.onFileChange((path, content) => {
  console.log(`File changed: ${path}`);
  // Update analysis, refresh diagnostics, etc.
});
```

## Plugin Manifest Reference

### Required Fields

- `id` (string): Unique identifier (e.g., "mide.my-plugin")
- `name` (string): Human-readable name
- `version` (string): Semantic version (e.g., "1.0.0")
- `author` (string): Plugin author
- `type` (string): Plugin type (`"js"` or `"rust"`)
- `main` (string): Entry point file
- `activation_events` (array): When to activate the plugin

### Optional Fields

- `description` (string): Plugin description
- `contributes` (object): Contributions (commands, languages, etc.)
- `permissions` (array): Required permissions

### Activation Events

- `"*"`: Activate on startup
- `"onLanguage:javascript"`: Activate when opening JS files
- `"onCommand:my-plugin.command"`: Activate before command runs
- `"workspaceContains:**/*.config.js"`: Activate if workspace contains pattern

### Contributes

```json
{
  "contributes": {
    "commands": [
      {
        "id": "my-plugin.command",
        "title": "My Command",
        "category": "My Plugin"
      }
    ],
    "configuration": {
      "enabled": {
        "type": "boolean",
        "default": true,
        "description": "Enable the plugin"
      },
      "maxFileSize": {
        "type": "number",
        "default": 1048576,
        "description": "Maximum file size to process"
      }
    }
  }
}
```

### Permissions

- `editor:read`: Read editor content
- `editor:write`: Modify editor content
- `editor:decorate`: Add decorations/highlights
- `fs:read`: Read files from disk
- `fs:write`: Write files to disk
- `shell:execute`: Execute shell commands
- `network:request`: Make HTTP requests

## Example Plugins

### 1. Auto Save

Automatically saves files after inactivity.

```javascript
let saveTimers = new Map();
const SAVE_DELAY = 2000;

function activate(api) {
  pluginAPI = api;

  pluginAPI.onFileChange((path, content) => {
    if (saveTimers.has(path)) {
      clearTimeout(saveTimers.get(path));
    }

    const timerId = setTimeout(async () => {
      await pluginAPI.writeFile(path, content);
      pluginAPI.showMessage(`Auto-saved: ${path.split("/").pop()}`, "info");
      saveTimers.delete(path);
    }, SAVE_DELAY);

    saveTimers.set(path, timerId);
  });
}
```

### 2. Word Counter

Count words, characters, and lines.

```javascript
function activate(api) {
  pluginAPI = api;

  pluginAPI.registerCommand("word-counter.count", async () => {
    const path = pluginAPI.getActiveFile();
    if (!path) return;

    const content = pluginAPI.getFileContent(path);
    const stats = {
      lines: content.split("\n").length,
      words: content.split(/\s+/).filter((w) => w.length > 0).length,
      chars: content.length,
    };

    pluginAPI.showMessage(
      `Lines: ${stats.lines}, Words: ${stats.words}, Chars: ${stats.chars}`,
      "info"
    );
  });
}
```

### 3. TODO Highlighter

Find and highlight TODO comments.

```javascript
function activate(api) {
  pluginAPI = api;

  pluginAPI.registerCommand("todo-highlighter.find", findTodos);

  pluginAPI.onFileOpen((path) => {
    const content = pluginAPI.getFileContent(path);
    if (content) findTodos();
  });
}

function findTodos() {
  const path = pluginAPI.getActiveFile();
  if (!path) return;

  const content = pluginAPI.getFileContent(path);
  const regex = /(TODO|FIXME|HACK|NOTE):\s*(.+)/gi;
  const todos = [];

  content.split("\n").forEach((line, index) => {
    const match = regex.exec(line);
    if (match) {
      todos.push({
        type: match[1],
        text: match[2],
        line: index + 1,
      });
    }
  });

  console.log(`Found ${todos.length} TODOs:`, todos);
}
```

## Best Practices

### 1. Error Handling

Always wrap async operations in try-catch:

```javascript
async function myCommand() {
  try {
    const content = await pluginAPI.readFile(path);
    // Process content...
  } catch (error) {
    pluginAPI.showMessage(`Error: ${error.message}`, "error");
  }
}
```

### 2. Resource Cleanup

Clean up resources in `deactivate()`:

```javascript
let timers = [];

function activate(api) {
  const timerId = setInterval(() => {
    /* ... */
  }, 1000);
  timers.push(timerId);
}

function deactivate() {
  timers.forEach(clearInterval);
  timers = [];
}
```

### 3. Performance

- Debounce expensive operations on file change events
- Use `onFileOpen` for one-time setup per file
- Cache results when appropriate

```javascript
const cache = new Map();

pluginAPI.onFileChange((path, content) => {
  // Debounce analysis
  clearTimeout(cache.get(path)?.timeout);
  cache.set(path, {
    timeout: setTimeout(() => analyzeFile(path, content), 500),
  });
});
```

### 4. User Feedback

Provide clear feedback for long operations:

```javascript
async function longOperation() {
  pluginAPI.setStatusBarMessage("Processing...");

  try {
    await doWork();
    pluginAPI.showMessage("Done!", "info");
  } finally {
    pluginAPI.setStatusBarMessage(""); // Clear status
  }
}
```

## Debugging

### Console Logging

All `console.log` calls are visible in the browser dev tools:

```javascript
console.log("Debug info:", data);
console.warn("Warning:", issue);
console.error("Error:", error);
```

### Error Messages

Show errors to users:

```javascript
try {
  // risky operation
} catch (error) {
  console.error("Operation failed:", error);
  pluginAPI.showMessage(`Failed: ${error.message}`, "error");
}
```

## Plugin Installation

### Manual Installation

1. Create plugin directory: `~/.mide/plugins/my-plugin/`
2. Add `plugin.json` and `index.js`
3. Restart MIDE or run "Refresh Extensions"

### Plugin Discovery

MIDE automatically scans `~/.mide/plugins/` for plugins on startup.

## Advanced Topics

### Configuration

Access plugin configuration:

```javascript
const config = {
  enabled: true,
  delay: 2000,
};

// Users can modify config through plugin settings
```

### Multi-file Operations

Process multiple files:

```javascript
const openFiles = pluginAPI.getOpenFiles();

for (const path of openFiles) {
  const content = pluginAPI.getFileContent(path);
  // Process each file...
}
```

### Workspace Operations

Work with the entire workspace:

```javascript
const workspace = pluginAPI.getWorkspacePath();
const configPath = `${workspace}/.config.json`;
const config = await pluginAPI.readFile(configPath);
```

## Examples in This Repository

Check out these example plugins in the `plugins/` directory:

1. **hello-world**: Basic plugin template
2. **word-counter**: Document statistics
3. **file-analyzer**: File size analysis
4. **todo-highlighter**: Find TODO comments
5. **auto-save**: Automatic file saving
6. **prettier-format**: Code formatter
7. **git-lens**: Git integration
8. **bracket-colorizer**: Colorize brackets

## Support

For help with plugin development:

- Check the example plugins
- Review the API documentation
- Open an issue on GitHub

## Future Features

Coming soon:

- LSP (Language Server Protocol) integration
- Native Rust plugins
- Custom UI panels
- Theme contributions
- Keybinding contributions
- Marketplace integration
