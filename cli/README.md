# MIDE CLI

A command-line interface for opening directories in MIDE editor, similar to `code .` for VS Code or `zed .` for Zed.

## Installation

Run the installation script:

```bash
cd ~/ProgrammingFiles/Professional/MIDE/cli
./install.sh
```

This will:

- Make the CLI script executable
- Create a symlink in `/usr/local/bin` (or `~/.local/bin` if no sudo access)
- Add `mide` command to your PATH

## Usage

```bash
# Open current directory
mide .

# Open a specific directory
mide /path/to/project

# Open parent directory
mide ..

# Open relative path
mide ./subfolder
```

## How it works

1. The CLI script (`mide`) takes a directory path as argument
2. Converts relative paths (like `.` or `..`) to absolute paths
3. Finds the MIDE executable (checks dev build, release build, or installed location)
4. Launches MIDE with the directory path as an argument
5. The Tauri app reads the CLI argument and automatically opens the project

## Uninstallation

To remove the CLI:

```bash
# If installed to /usr/local/bin
sudo rm /usr/local/bin/mide

# If installed to ~/.local/bin
rm ~/.local/bin/mide
```

## Troubleshooting

**Command not found:**

- Make sure `~/.local/bin` is in your PATH (if installed there)
- Add to your shell config: `export PATH="$HOME/.local/bin:$PATH"`

**MIDE executable not found:**

- Build the app first: `npm run tauri build` or `npm run tauri dev`
- The script looks for the executable in these locations:
  - `src-tauri/target/debug/app` (dev build)
  - `src-tauri/target/release/app` (release build)
  - `/usr/local/bin/mide-app` (installed)
