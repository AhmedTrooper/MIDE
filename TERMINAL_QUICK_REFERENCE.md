# Terminal Quick Reference

## Accessing Terminal

### From Sidebar

1. Click **Terminal** icon (💻) in left activity bar
2. Full terminal view opens in sidebar

### From Bottom Panel (Legacy)

- Press **Ctrl+`** to toggle terminal panel

## Terminal Tabs

| Action          | How To                                 |
| --------------- | -------------------------------------- |
| New Terminal    | Click **+** button or **Ctrl+Shift+`** |
| Switch Terminal | Click on terminal tab                  |
| Close Terminal  | Click **×** on tab (hover to reveal)   |
| Split Terminal  | Click split icon in toolbar            |

## Virtual Environments

### Auto-Detection

✅ **venv/virtualenv** - Standard Python venvs  
✅ **Conda** - Anaconda environments  
✅ **Pipenv** - Pipenv-managed environments  
✅ **Poetry** - Poetry-managed environments

### Activation

1. Look for **"Activate Venv"** button in toolbar
2. Click to see detected environments
3. Select environment to activate
4. Green ✓ appears on terminal tab when active

### Manual Commands

```bash
# Linux/macOS
source venv/bin/activate

# Windows
venv\Scripts\activate.bat

# Conda
conda activate myenv
```

## Command History

| Key        | Action            |
| ---------- | ----------------- |
| **↑**      | Previous command  |
| **↓**      | Next command      |
| **Enter**  | Execute command   |
| **Ctrl+C** | Interrupt command |

## Terminal Controls

| Icon   | Action         | Shortcut   |
| ------ | -------------- | ---------- |
| **⊞**  | Split Terminal | -          |
| **📋** | Copy Output    | -          |
| **🗑️** | Clear Terminal | **Ctrl+L** |
| **⚙️** | Settings       | -          |

## Special Commands

```bash
clear    # Clear terminal output
cls      # Clear (Windows style)
cd       # Change directory
exit     # Close terminal
```

## Quick Tips

💡 **Tip 1**: Terminals remember their working directory  
💡 **Tip 2**: Each terminal can have a different venv active  
💡 **Tip 3**: Command history is per-terminal  
💡 **Tip 4**: Auto-scroll keeps latest output visible  
💡 **Tip 5**: Close unused terminals to save resources

## Common Workflows

### Python Development

```bash
# Create venv
python -m venv .venv

# Activate (auto-detected by MIDE)
# Click "Activate Venv" button

# Install dependencies
pip install -r requirements.txt

# Run script
python main.py
```

### Multiple Tasks

- **Terminal 1**: `npm run dev` (dev server)
- **Terminal 2**: `pytest` (run tests)
- **Terminal 3**: `git status` (version control)
- **Terminal 4**: Free for ad-hoc commands

### Django Development

```bash
# Terminal 1: Activate venv + run server
python manage.py runserver

# Terminal 2: Activate same venv + migrations
python manage.py makemigrations
python manage.py migrate

# Terminal 3: Shell access
python manage.py shell
```

## Troubleshooting

### Problem: Venv not detected

**Solution**: Click "Refresh" in venv menu or ensure venv is in standard location

### Problem: Command not found

**Solution**: Check if venv is activated and command is in PATH

### Problem: Terminal not responding

**Solution**: Press Ctrl+C to interrupt, or close and open new terminal

### Problem: Can't type commands

**Solution**: Click in command input area to focus

## Keyboard Shortcuts Summary

```
Ctrl+`          Toggle terminal panel (bottom)
Enter           Execute command
↑ / ↓          Command history navigation
Ctrl+C          Interrupt command
Ctrl+L          Clear terminal
Ctrl+Shift+`    New terminal
Ctrl+B          Toggle sidebar
```

## Pro Tips

🚀 **Performance**: Close terminals you're not using  
🎯 **Organization**: Name terminals for different tasks  
⚡ **Speed**: Use command history instead of retyping  
🔧 **Debugging**: Keep one terminal free for testing commands  
📦 **Dependencies**: Always activate venv before pip install

---

**Need Help?** Check TERMINAL_FEATURES.md for detailed documentation
