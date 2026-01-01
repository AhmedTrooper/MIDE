# Terminal Enhancement Documentation

## Overview

The MIDE terminal has been completely redesigned to provide a robust, professional experience comparable to JetBrains IDEs, VSCode, and Zed. It features sidebar integration, multiple terminal instances, and intelligent Python virtual environment detection.

## Key Features

### 1. **Sidebar Integration (JetBrains-style)**

- Access terminal from the left activity bar
- Dedicated terminal icon for quick access
- Full-width terminal view when activated
- Seamlessly integrated with other sidebar views

### 2. **Multiple Terminal Instances**

- Create unlimited terminal tabs
- Each terminal maintains its own:
  - Working directory
  - Output history
  - Virtual environment state
  - Command history
- Easy tab switching with visual indicators
- Close individual terminals without affecting others

### 3. **Python Virtual Environment Support**

#### Auto-Detection

The terminal automatically detects:

- **venv/virtualenv**: Standard Python virtual environments
  - Checks: `venv/`, `.venv/`, `env/`, `.env/`, `virtualenv/`
- **Conda**: Anaconda/Miniconda environments
  - Scans: `~/.conda/envs/`
- **Pipenv**: Project-specific Pipenv environments
  - Detects: `Pipfile` and runs `pipenv --venv`
- **Poetry**: Poetry-managed virtual environments
  - Detects: `pyproject.toml` and runs `poetry env info --path`

#### Auto-Activation

- If a single virtual environment is detected, it's automatically activated on terminal creation
- Manual activation available for multiple detected environments
- Visual indicator shows when a venv is active (green checkmark)

#### Activation Commands

The terminal uses platform-specific activation:

- **Linux/macOS**: `source <venv>/bin/activate`
- **Windows**: `<venv>\Scripts\activate.bat`
- **Conda**: `conda activate <env-name>`

### 4. **Advanced Terminal Features**

#### Command History

- **Arrow Up/Down**: Navigate through command history
- Persistent across terminal sessions
- Per-terminal history tracking

#### Terminal Controls

- **New Terminal**: Create additional terminal instances
- **Split Terminal**: Duplicate current terminal with same settings
- **Clear**: Clear terminal output
- **Copy Output**: Copy all terminal output to clipboard
- **Close**: Close current terminal tab
- **Settings**: Configure terminal preferences (future)

#### Special Commands

- `clear` / `cls`: Clear terminal output
- `cd <directory>`: Change working directory
- **Ctrl+C**: Send interrupt signal

#### Virtual Environment Menu

- Click "Activate Venv" button to see all detected environments
- Shows environment type (venv, conda, virtualenv)
- Indicates currently active environment
- Refresh to re-scan for new environments

### 5. **Visual Design**

#### Terminal Tabs

- Clean tab interface at the top
- Active tab highlighting
- Hover effects for better UX
- Close button appears on hover
- Green checkmark for venv-activated terminals

#### Toolbar

- Shows current working directory
- Virtual environment activation button (when venvs detected)
- Quick access to terminal actions
- Minimalist, professional design

#### Output Area

- Monaco-style terminal output
- Auto-scroll to latest output
- Proper line wrapping
- Syntax highlighting for errors (future)

#### Input Line

- Command prompt with `$` indicator
- Auto-focus on terminal creation
- Keyboard shortcuts support

## Keyboard Shortcuts

| Shortcut   | Action                         |
| ---------- | ------------------------------ |
| **Ctrl+`** | Toggle terminal panel (bottom) |
| **Enter**  | Execute command                |
| **↑**      | Previous command in history    |
| **↓**      | Next command in history        |
| **Ctrl+C** | Interrupt current command      |
| **Ctrl+L** | Clear terminal (alternative)   |

## Architecture

### Frontend Components

#### **TerminalView.tsx**

Main terminal component with:

- Tab management
- Terminal instance state
- Command execution
- Virtual environment detection
- UI rendering

#### **Store Updates (store.ts)**

New state management:

```typescript
interface TerminalInstance {
  id: string;
  name: string;
  output: string[];
  cwd: string;
  isActive: boolean;
  venvActivated: boolean;
  venvPath?: string;
}
```

Functions:

- `addTerminal(cwd?, name?)` - Create new terminal
- `removeTerminal(id)` - Close terminal
- `setActiveTerminal(id)` - Switch active terminal
- `appendToTerminal(id, line)` - Add output line
- `clearTerminal(id)` - Clear terminal output
- `updateTerminalName(id, name)` - Rename terminal
- `activateVenvInTerminal(id, venvPath)` - Activate venv

### Backend (Rust)

#### **terminal.rs**

New command: `detect_virtual_environments(project_path)`

- Scans project for Python virtual environments
- Checks multiple environment types
- Returns structured environment information
- Platform-aware path handling

#### **Virtual Environment Detection Logic**

1. Check standard venv directories
2. Verify Python executable exists
3. Detect Conda environments
4. Check for Pipenv/Poetry configurations
5. Return all found environments with type information

## Usage Examples

### Creating a New Terminal

1. Click Terminal icon in activity bar (left sidebar)
2. Or click the **+** button in terminal tabs
3. Terminal opens with current project directory

### Activating Virtual Environment

1. Open terminal view
2. If venv detected, click "Activate Venv" button
3. Select desired environment from dropdown
4. Environment activates automatically
5. Green checkmark appears on terminal tab

### Running Python Code

```bash
# Without venv (uses system Python)
$ python script.py

# With activated venv (uses venv Python)
$ python script.py  # Automatically uses venv Python
$ pip install package  # Installs to venv
```

### Managing Multiple Terminals

1. Click **+** to create new terminal
2. Each terminal can have different:
   - Working directory
   - Virtual environment
   - Running processes
3. Switch between terminals with tab clicks
4. Close with **X** button on tab

## Best Practices

### Virtual Environment Workflow

1. Create venv in project root: `python -m venv .venv`
2. Open terminal in MIDE
3. Terminal auto-detects and offers activation
4. Click to activate
5. Install dependencies: `pip install -r requirements.txt`
6. Run scripts with venv Python

### Multiple Terminal Use Cases

- **Terminal 1**: Development server running
- **Terminal 2**: Running tests
- **Terminal 3**: Git commands
- **Terminal 4**: Database operations

### Performance Tips

- Close unused terminals to free resources
- Clear terminal output regularly for better performance
- Use split terminal for related tasks

## Comparison with Other IDEs

| Feature               | MIDE | JetBrains | VSCode | Zed |
| --------------------- | ---- | --------- | ------ | --- |
| Sidebar Terminal      | ✅   | ✅        | ❌     | ✅  |
| Multiple Tabs         | ✅   | ✅        | ✅     | ✅  |
| Auto Venv Detection   | ✅   | ✅        | ⚠️     | ❌  |
| Auto Venv Activation  | ✅   | ✅        | ⚠️     | ❌  |
| Command History       | ✅   | ✅        | ✅     | ✅  |
| Split Terminal        | ✅   | ✅        | ✅     | ✅  |
| Conda Support         | ✅   | ✅        | ⚠️     | ❌  |
| Poetry/Pipenv Support | ✅   | ✅        | ⚠️     | ❌  |

✅ = Fully Supported | ⚠️ = Partial Support | ❌ = Not Supported

## Future Enhancements

### Planned Features

1. **Interactive Shell**

   - Real-time command execution
   - Shell emulation (bash, zsh, fish)
   - PTY support

2. **Enhanced Venv Management**

   - Create venv from UI
   - Install from requirements.txt
   - Environment switching without restart

3. **Terminal Customization**

   - Custom colors and themes
   - Font size adjustment
   - Line height configuration

4. **Smart Command Suggestions**

   - Auto-complete common commands
   - Suggest based on project type
   - Context-aware completions

5. **Terminal Persistence**

   - Save terminal state between sessions
   - Restore command history
   - Remember active venv

6. **Advanced Features**
   - Terminal splitting (horizontal/vertical)
   - Terminal groups
   - Broadcast input to multiple terminals
   - Search in terminal output

## Troubleshooting

### Virtual Environment Not Detected

- Ensure venv is in a standard location (venv, .venv, etc.)
- Check that Python executable exists in venv
- Click "Refresh" in venv menu
- Verify project path is set correctly

### Commands Not Executing

- Check terminal output for error messages
- Verify working directory is correct
- Ensure command exists in PATH
- Try running in system terminal to isolate issue

### Virtual Environment Not Activating

- Verify venv path is correct
- Check Python executable exists
- Ensure activation script has execute permissions (Linux/macOS)
- Try manual activation in system terminal

## Technical Details

### Command Execution Flow

1. User types command and presses Enter
2. Command parsed into executable and arguments
3. If venv active, path adjusted to use venv Python
4. Command sent to backend via Tauri IPC
5. Backend spawns process with specified working directory
6. Output streamed back to frontend via events
7. Output displayed in real-time in terminal

### Event System

- `term-data-{id}`: Output from terminal
- `term-exit-{id}`: Process exit code
- `term-error-{id}`: Error messages

### State Management

- Zustand store manages all terminal instances
- Each terminal has unique ID (timestamp-based)
- Active terminal tracked separately
- Terminal output stored in memory (consider limits for large output)

## Contributing

To extend terminal functionality:

1. Update `TerminalInstance` interface in store.ts
2. Add new actions to store
3. Implement UI in TerminalView.tsx
4. Add backend support in terminal.rs if needed
5. Update documentation

## Conclusion

The MIDE terminal provides a production-ready, professional terminal experience with intelligent Python virtual environment support. It combines the best features from JetBrains, VSCode, and Zed while maintaining a clean, intuitive interface.
