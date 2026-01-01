# MIDE Plugin System

A robust, flexible, and fast plugin system for MIDE - competing with VSCode and Zed.

## Architecture

MIDE supports two types of plugins:

### 1. JavaScript Plugins

- Run in isolated Web Workers for safety and performance
- No Node.js - pure browser-compatible JavaScript
- Perfect for UI extensions, commands, and lightweight functionality
- Hot-reloadable for fast development

### 2. Rust Plugins (Coming Soon)

- Native performance for heavy operations
- Full system access via Tauri APIs
- Ideal for language servers, formatters, and performance-critical features

## Plugin Structure

```
~/.mide/plugins/
  └── your-plugin/
      ├── plugin.json    # Plugin manifest
      └── index.js       # Main entry point (for JS plugins)
```

## Creating a Plugin

### 1. Plugin Manifest (`plugin.json`)

```json
{
  "id": "my-plugin",
  "name": "My Awesome Plugin",
  "version": "1.0.0",
  "description": "Does something awesome",
  "author": "Your Name",
  "type": "js",
  "main": "index.js",
  "activation_events": [
    "onStartup",
    "onLanguage:javascript",
    "onCommand:myCommand"
  ],
  "contributes": {
    "commands": [
      {
        "id": "my-plugin.myCommand",
        "title": "My Command",
        "category": "My Plugin"
      }
    ],
    "languages": [
      {
        "id": "mylang",
        "extensions": [".ml"]
      }
    ],
    "keybindings": [
      {
        "command": "my-plugin.myCommand",
        "key": "Ctrl+Shift+M"
      }
    ]
  },
  "permissions": ["fs:read", "fs:write", "editor:read"],
  "enabled": true
}
```

### 2. Plugin Code (`index.js`)

```javascript
let pluginAPI;

// Handle messages from main thread
self.onmessage = function (e) {
  const { type, data } = e.data;

  if (type === "activate") {
    pluginAPI = createAPI();
    activate();
  }
};

// Create API wrapper
function createAPI() {
  // Implementation provided by MIDE
  return {
    executeCommand: (id, ...args) => {},
    showMessage: (msg, type) => {},
    getActiveFile: () => {},
    readFile: (path) => {},
    writeFile: (path, content) => {},
  };
}

// Register command
function registerCommand(id, handler) {
  self.postMessage({
    type: "registerCommand",
    data: { commandId: id },
  });
}

// Plugin activation
function activate() {
  console.log("Plugin activated!");

  registerCommand("my-plugin.myCommand", myCommand);

  pluginAPI.showMessage("Plugin ready!", "info");
}

// Command implementation
async function myCommand() {
  const file = await pluginAPI.getActiveFile();
  if (file) {
    const content = await pluginAPI.readFile(file);
    // Do something with content
  }
}
```

## Plugin API

### Commands

- `executeCommand(commandId, ...args)` - Execute a command
- `registerCommand(commandId, handler)` - Register a command handler

### Messages

- `showMessage(message, type)` - Show info/warning/error message
  - Types: `'info' | 'warning' | 'error'`

### Editor

- `getActiveFile()` - Get path of active file
- `getWorkspacePath()` - Get current workspace path

### File System

- `readFile(path)` - Read file contents
- `writeFile(path, content)` - Write file contents

## Activation Events

Plugins can be activated on specific events:

- `onStartup` - When MIDE starts
- `onLanguage:javascript` - When opening a specific language file
- `onCommand:commandId` - When a command is executed
- `onView:viewId` - When a view is opened
- `onFileSystem:scheme` - When file system event occurs

## Permissions

Plugins must declare required permissions:

- `fs:read` - Read file system
- `fs:write` - Write file system
- `editor:read` - Read editor content
- `editor:write` - Modify editor content
- `shell:execute` - Execute shell commands
- `network:request` - Make network requests

## Example Plugins

See the `example-plugins/` directory for working examples:

- `hello-world` - Basic command registration
- More examples coming soon!

## Development Tips

1. **Hot Reload**: Disable and re-enable plugin to reload changes
2. **Debugging**: Use `console.log()` - visible in DevTools
3. **Testing**: Test with small, focused functionality first
4. **Performance**: Use Web Workers effectively - no blocking operations

## Distribution

Coming soon:

- Plugin marketplace
- Easy install from GitHub
- Version management
- Auto-updates

## Roadmap

- [x] JavaScript plugin support
- [x] Web Worker isolation
- [x] Basic plugin API
- [ ] Rust plugin support
- [ ] Enhanced API (decorations, code actions, etc.)
- [ ] Plugin marketplace
- [ ] Language Server Protocol integration
- [ ] Debug Adapter Protocol support
- [ ] Plugin dependency management

## Contributing

We welcome plugin contributions! Check out the [CONTRIBUTING.md](../CONTRIBUTING.md) for guidelines.

## License

Plugin system is MIT licensed. Individual plugins may have different licenses.
