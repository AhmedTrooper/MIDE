# MIDE CLI Implementation Summary

## What Was Implemented

A command-line interface for MIDE that allows you to open directories directly from the terminal, similar to:

- `code .` (VS Code)
- `zed .` (Zed Editor)
- `subl .` (Sublime Text)

## Changes Made

### 1. **Rust Backend** (`src-tauri/src/lib.rs`)

- Added `get_cli_args()` command to expose command-line arguments to the frontend
- Allows the app to read which directory was passed when launched

### 2. **Frontend Store** (`src/lib/store.ts`)

- Added `openProjectByPath(path: string)` method
- Separates the logic of opening a project by path from the dialog-based opening
- Can be called programmatically when CLI args are detected

### 3. **App Entry Point** (`src/App.tsx`)

- Added CLI argument detection on app startup
- Automatically opens the provided directory path if present
- Handles errors gracefully

### 4. **CLI Scripts** (`cli/` directory)

#### `cli/mide` (Main CLI script)

- Accepts directory path as argument (`.`, `..`, relative, or absolute paths)
- Converts relative paths to absolute paths
- Validates that the path exists and is a directory
- Finds the MIDE executable (dev, release, or installed)
- Launches MIDE with the directory path

#### `cli/install.sh` (Installation script)

- Makes CLI script executable
- Creates symlink in `/usr/local/bin` or `~/.local/bin`
- Provides PATH configuration instructions
- User-friendly installation process

#### `cli/demo.sh` (Demo script)

- Creates a sample project with multiple files
- Demonstrates CLI usage
- Shows example commands
- Launches MIDE with the demo project

### 5. **Documentation**

- Added `cli/README.md` with detailed usage instructions
- Updated main `README.md` with CLI installation section
- Added npm scripts for easy CLI installation

## How It Works

```
Terminal Command         CLI Script              Tauri App
----------------         ----------              ---------
$ mide /path/to/dir  →  Validates path      →   Receives path
                        Converts to absolute     as CLI argument
                        Finds executable    →
                        Launches app with path   Detects argument
                                            →   Opens project
                                                automatically
```

## Usage

### Installation

```bash
cd cli
./install.sh
```

Or via npm:

```bash
npm run cli:install
```

### Basic Commands

```bash
# Open current directory
mide .

# Open specific directory
mide ~/projects/my-app

# Open parent directory
mide ..

# Open relative path
mide ./subfolder
```

### Demo

```bash
cd cli
./demo.sh
```

## File Structure

```
MIDE/
├── cli/
│   ├── mide           # Main CLI script
│   ├── install.sh     # Installation script
│   ├── demo.sh        # Demo script
│   └── README.md      # CLI documentation
├── src/
│   ├── App.tsx        # CLI args detection
│   └── lib/
│       └── store.ts   # openProjectByPath method
└── src-tauri/
    └── src/
        └── lib.rs     # get_cli_args command
```

## Features

✅ **Path Conversion**: Handles `.`, `..`, relative, and absolute paths
✅ **Validation**: Checks if directory exists before launching
✅ **Auto-detection**: Finds executable in dev, release, or installed locations
✅ **Error Handling**: Graceful error messages for invalid paths or missing executables
✅ **Background Launch**: Runs app in background, returns terminal control immediately
✅ **Cross-platform Ready**: Script structure supports easy Windows adaptation

## Future Enhancements

Possible improvements:

- Windows batch/PowerShell script equivalent
- Support for opening specific files (not just directories)
- Multiple directory/window support
- Deep linking to specific lines in files (`mide file.js:42`)
- Integration with shell aliases and completions
- Desktop integration (right-click context menu)

## Testing

1. **Installation test**:

   ```bash
   which mide
   # Should output: /home/user/.local/bin/mide
   ```

2. **Current directory test**:

   ```bash
   cd /tmp/mide-test-project
   mide .
   # Should open /tmp/mide-test-project in MIDE
   ```

3. **Absolute path test**:

   ```bash
   mide /home/user/projects/my-app
   # Should open specified directory
   ```

4. **Error handling test**:
   ```bash
   mide /nonexistent/path
   # Should show error message
   ```

## Comparison with Other Editors

| Editor   | Command      | Implementation                     |
| -------- | ------------ | ---------------------------------- |
| VS Code  | `code .`     | Native CLI tool installed with app |
| Zed      | `zed .`      | CLI script in PATH                 |
| Sublime  | `subl .`     | Native CLI tool                    |
| **MIDE** | **`mide .`** | **Shell script + Tauri args**      |

## Notes

- The CLI script needs to be reinstalled if you move the MIDE directory
- For production distribution, consider packaging the CLI tool with the app installer
- The script prioritizes dev builds over release builds for development convenience
