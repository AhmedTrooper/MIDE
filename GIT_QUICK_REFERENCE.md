# Git Services Quick Reference

## 🎯 Key Features at a Glance

### Source Control Panel Layout

```
┌─────────────────────────────────┐
│ SOURCE CONTROL        [↻] [⋯]  │ ← Header with refresh & menu
├─────────────────────────────────┤
│ main ↑2 ↓1                      │ ← Current branch & sync status
├─────────────────────────────────┤
│ [Changes][History][Branches]    │ ← View mode tabs
├─────────────────────────────────┤
│ ┌─────────────────────────────┐ │
│ │ Commit message...            │ │ ← Commit message input
│ │                              │ │
│ └─────────────────────────────┘ │
│ [✓ Commit]              [v]     │ ← Commit button + options
├─────────────────────────────────┤
│ ▼ STAGED CHANGES (3)      [-]   │ ← Staged section
│   M  src/main.rs          [-]   │
│   A  src/new.rs           [-]   │
│   D  old.txt              [-]   │
│                                 │
│ ▼ CHANGES (2)             [+]   │ ← Unstaged section
│   M  README.md      [↻] [+]     │
│   U  config.json    [↻] [+]     │
└─────────────────────────────────┘
```

### Status Icons

- **M** = Modified (Blue)
- **U** = Untracked (Green)
- **A** = Added (Green)
- **D** = Deleted (Red)
- **R** = Renamed (Purple)

### Action Buttons

- **[+]** = Stage file
- **[-]** = Unstage file
- **[↻]** = Discard changes
- **[↑]** = Push to remote
- **[↓]** = Pull from remote

## 🔄 Common Workflows

### 1. Stage, Commit, Push

```
1. Click [+] on files to stage
   OR click [+] in section header for all
2. Type commit message
3. Press Ctrl+Enter or click [Commit]
4. Click [⋯] → Push
```

### 2. Create & Switch Branch

```
1. Click [Branches] tab
2. Click [+ New Branch]
3. Enter branch name
4. Press Enter (auto-switches)
```

### 3. View File Changes

```
1. Right-click on any file
2. Select "View Changes"
3. See diff with syntax highlighting
4. Press Esc or click Close
```

### 4. Discard Changes

```
1. Right-click on unstaged file
2. Select "Discard Changes"
3. Confirm in dialog
```

### 5. Sync with Remote

```
Quick sync:
[⋯] → Pull  (fetch + merge)
[⋯] → Push  (upload commits)
[⋯] → Fetch (download only)
```

## 🎨 Visual Indicators

### Branch Status Bar

```
┌────────────────────────────┐
│ 🔀 main  ↑2  ↓1           │
│  └─┬─   └─┬  └─┬          │
│    │      │    │          │
│    │      │    └── Behind 1 commit
│    │      └─────── Ahead 2 commits
│    └────────────── Current branch
└────────────────────────────┘
```

### Context Menu (Right-Click)

```
Staged File:
├─ Unstage Changes
├─ ───────────────
├─ Open File
└─ View Changes

Unstaged File:
├─ Stage Changes
├─ Discard Changes
├─ ───────────────
├─ Open File
└─ View Changes
```

## ⌨️ Keyboard Shortcuts

| Shortcut     | Action                   |
| ------------ | ------------------------ |
| `Ctrl+Enter` | Commit changes           |
| `Esc`        | Close diff viewer        |
| `Enter`      | Create branch (in input) |
| `Esc`        | Cancel branch creation   |

## 🎭 View Modes

### Changes Tab

- See all modified files
- Stage/unstage operations
- Commit interface
- File-level actions

### History Tab

- Last 50 commits
- Author information
- Commit messages
- Hash references

### Branches Tab

- All branches list
- Current branch highlight
- Create new branches
- Switch & delete operations

## 🔧 Advanced Features

### Commit Options Menu

```
Click [v] next to Commit:
├─ Commit & Push
├─ Commit & Sync
└─ Amend Last Commit
```

### Branch Operations

```
Right-click branch:
├─ Checkout (switch to)
├─ ───────────────
├─ Merge into current
└─ Delete
```

### Remote Menu

```
Click [⋯] in header:
├─ Pull
├─ Push
├─ Fetch
├─ ───────────────
├─ Sync
└─ View Remotes
```

## 💡 Pro Tips

1. **Batch Operations**: Use section [+]/[-] buttons to stage/unstage all files at once

2. **Quick Commit**: Type message and press `Ctrl+Enter` instead of clicking

3. **Visual Diffs**: Always review changes before staging by right-clicking

4. **Branch Preview**: Hover over branch name to see remote tracking info

5. **Error Recovery**: If operation fails, check error message at top of panel

6. **Refresh Data**: Click [↻] if changes don't appear immediately

7. **Keyboard First**: Most operations accessible via keyboard for speed

## 🚨 Safety Features

### Confirmations Required For:

- ❌ Discard changes (can't undo)
- ❌ Delete branch (permanent)
- ❌ Force operations

### No Confirmation For:

- ✅ Stage/unstage (reversible)
- ✅ Commit (can amend)
- ✅ Switch branch (changes saved)

## 📊 Status Indicators

```
Loading:    [↻] spinning icon
Success:    Changes reflected immediately
Error:      Red banner at top with message
Warning:    Yellow indicators for conflicts
Info:       Blue badges for ahead/behind
```

## 🎯 Git Command Mapping

| UI Action     | Git Command                                |
| ------------- | ------------------------------------------ |
| Stage         | `git add <file>`                           |
| Unstage       | `git restore --staged <file>`              |
| Discard       | `git restore <file>`                       |
| Commit        | `git commit -m "..."`                      |
| Pull          | `git pull`                                 |
| Push          | `git push`                                 |
| Fetch         | `git fetch`                                |
| New Branch    | `git branch <name> && git checkout <name>` |
| Switch Branch | `git checkout <branch>`                    |
| Delete Branch | `git branch -d <branch>`                   |

## 🔍 Troubleshooting Quick Guide

| Issue               | Solution                        |
| ------------------- | ------------------------------- |
| No changes showing  | Click refresh [↻]               |
| Can't commit        | Check if files are staged       |
| Push failed         | Pull first or check credentials |
| Branch won't delete | Can't delete current branch     |
| Changes not staged  | Click [+] on each file          |
| Diff not showing    | File must have changes          |

---

**Need more help?** Check [GIT_FEATURES.md](./GIT_FEATURES.md) for detailed documentation.
