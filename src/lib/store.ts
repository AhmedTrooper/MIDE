import { create } from 'zustand';
import { invoke } from "@tauri-apps/api/core";
import { open, confirm } from "@tauri-apps/plugin-dialog";
import { type FileNode } from '../components/ui/FileTree';
import { pluginEvents } from './pluginStore';

export interface OpenFile {
    path: string;
    name: string;
    content: string;
    language: string;
    isDirty: boolean;
}

export interface SearchResult {
    file: string;
    line: number;
    content: string;
}

export interface RunConfiguration {
    id: string;
    name: string;
    command: string;
    args?: string[];
    cwd?: string;
}

export interface EditorGroup {
    id: string;
    activeFile: string | null;
}

export interface TerminalInstance {
    id: string;
    name: string;
    output: string[];
    cwd: string;
    isActive: boolean;
    venvActivated: boolean;
    venvPath?: string;
    isRunning: boolean;
}

export type SplitDirection = 'none' | 'horizontal' | 'vertical';

interface EditorState {
    fileTree: FileNode | null;
    openFiles: OpenFile[];
    activeFile: string | null;
    activeView: string; // 'explorer', 'search', etc.

    // Split Editor State
    splitDirection: SplitDirection;
    editorGroups: EditorGroup[];
    activeGroupId: string;
    projectPath: string | null;
    isCommandPaletteOpen: boolean;
    isTerminalOpen: boolean;
    isSidebarCollapsed: boolean;
    isFindWidgetOpen: boolean;
    isFindReplaceMode: boolean;
    searchResults: SearchResult[];
    isSearching: boolean;
    searchQuery: string;
    selectedNode: { path: string; isDir: boolean } | null;
    creationState: { type: 'file' | 'folder'; parentPath: string } | null;

    // Run Configuration State
    runConfigurations: RunConfiguration[];
    activeRunConfigId: string | null;
    isRunConfigDialogOpen: boolean;

    // Terminal State
    terminals: TerminalInstance[];
    activeTerminalId: string | null;
    addTerminal: (cwd?: string, name?: string) => void;
    removeTerminal: (id: string) => void;
    setActiveTerminal: (id: string) => void;
    appendToTerminal: (id: string, line: string) => void;
    clearTerminal: (id: string) => void;
    updateTerminalName: (id: string, name: string) => void;
    updateTerminalCwd: (id: string, cwd: string) => void;
    activateVenvInTerminal: (id: string, venvPath: string) => void;
    setTerminalRunning: (id: string, isRunning: boolean) => void;

    // ADB State
    adbDevices: string[];
    setAdbDevices: (devices: string[]) => void;
    avdList: string[];
    setAvdList: (avds: string[]) => void;

    // Recent Projects
    recentProjects: string[];
    addRecentProject: (path: string) => void;
    removeRecentProject: (path: string) => void;

    setFileTree: (tree: FileNode) => void;
    setProjectPath: (path: string) => void;
    setActiveView: (view: string) => void;
    setCommandPaletteOpen: (isOpen: boolean) => void;
    setSidebarCollapsed: (isCollapsed: boolean) => void;
    toggleSidebar: () => void;
    setFindWidgetOpen: (isOpen: boolean) => void;
    setFindReplaceMode: (isReplace: boolean) => void;
    openFile: (file: OpenFile) => void;
    closeFile: (path: string) => void;
    setActiveFile: (path: string) => void;
    updateFileContent: (path: string, content: string, markDirty?: boolean) => void;
    markFileDirty: (path: string, isDirty: boolean) => void;
    renameFile: (oldPath: string, newPath: string) => void;
    refreshTree: () => Promise<void>;
    openProjectDialog: () => Promise<void>;
    openProjectByPath: (path: string) => Promise<void>;
    performSearch: (query: string) => Promise<void>;
    setSearchQuery: (query: string) => void;
    setSelectedNode: (node: { path: string; isDir: boolean } | null) => void;
    setCreationState: (state: { type: 'file' | 'folder'; parentPath: string } | null) => void;

    // Run Configuration Actions
    setRunConfigurations: (configs: RunConfiguration[]) => void;
    setActiveRunConfigId: (id: string | null) => void;
    setRunConfigDialogOpen: (isOpen: boolean) => void;
    addRunConfiguration: (config: RunConfiguration) => void;

    // Split Editor Actions
    splitEditorHorizontal: () => void;
    splitEditorVertical: () => void;
    closeSplit: () => void;
    setActiveGroup: (groupId: string) => void;
    setGroupActiveFile: (groupId: string, filePath: string | null) => void;
}

export const useEditorStore = create<EditorState>((set, get) => ({
    fileTree: null,
    openFiles: [],
    activeFile: null,
    activeView: 'explorer',
    projectPath: null,

    recentProjects: JSON.parse(localStorage.getItem('recentProjects') || '[]'),

    // Split Editor Initial State
    splitDirection: 'none',
    editorGroups: [{ id: 'group-1', activeFile: null }],
    activeGroupId: 'group-1',
    isCommandPaletteOpen: false,
    isSidebarCollapsed: false,
    isFindWidgetOpen: false,
    isFindReplaceMode: false,
    searchResults: [],
    isSearching: false,
    searchQuery: "",
    selectedNode: null,
    creationState: null,

    runConfigurations: [
        { id: 'default', name: 'Echo Hello', command: 'echo', args: ['Hello', 'World'] }
    ],
    activeRunConfigId: 'default',
    isRunConfigDialogOpen: false,

    terminals: [],
    activeTerminalId: null,

    addTerminal: (cwd?: string, name?: string) => set((state) => {
        const id = `terminal-${Date.now()}`;
        const terminalName = name || `Terminal ${state.terminals.length + 1}`;
        const workingDir = cwd || state.projectPath || '~';

        const newTerminal: TerminalInstance = {
            id,
            name: terminalName,
            output: [`Welcome to ${terminalName}`, `Working directory: ${workingDir}`, ''],
            cwd: workingDir,
            isActive: true,
            venvActivated: false,
            isRunning: false,
        };

        return {
            terminals: [...state.terminals.map(t => ({ ...t, isActive: false })), newTerminal],
            activeTerminalId: id,
        };
    }),

    removeTerminal: (id) => set((state) => {
        const newTerminals = state.terminals.filter(t => t.id !== id);
        let newActiveId = state.activeTerminalId;

        if (state.activeTerminalId === id) {
            newActiveId = newTerminals.length > 0 ? newTerminals[newTerminals.length - 1].id : null;
        }

        return {
            terminals: newTerminals.map(t => ({
                ...t,
                isActive: t.id === newActiveId,
            })),
            activeTerminalId: newActiveId,
        };
    }),

    setActiveTerminal: (id) => set((state) => ({
        terminals: state.terminals.map(t => ({
            ...t,
            isActive: t.id === id,
        })),
        activeTerminalId: id,
    })),

    appendToTerminal: (id, line) => set((state) => ({
        terminals: state.terminals.map(t =>
            t.id === id ? { ...t, output: [...t.output, line] } : t
        ),
    })),

    clearTerminal: (id) => set((state) => ({
        terminals: state.terminals.map(t =>
            t.id === id ? { ...t, output: [] } : t
        ),
    })),

    updateTerminalName: (id, name) => set((state) => ({
        terminals: state.terminals.map(t =>
            t.id === id ? { ...t, name } : t
        ),
    })),

    updateTerminalCwd: (id, cwd) => set((state) => ({
        terminals: state.terminals.map(t =>
            t.id === id ? { ...t, cwd } : t
        ),
    })),

    activateVenvInTerminal: (id, venvPath) => set((state) => ({
        terminals: state.terminals.map(t =>
            t.id === id ? { ...t, venvActivated: true, venvPath } : t
        ),
    })),

    setTerminalRunning: (id, isRunning) => set((state) => ({
        terminals: state.terminals.map(t =>
            t.id === id ? { ...t, isRunning } : t
        ),
    })),

    adbDevices: [],
    setAdbDevices: (devices) => set({ adbDevices: devices }),
    avdList: [],
    setAvdList: (avds) => set({ avdList: avds }),

    setFileTree: (tree) => set({ fileTree: tree }),
    setProjectPath: (path) => set({ projectPath: path }),
    setActiveView: (view) => set({ activeView: view }),
    setCommandPaletteOpen: (isOpen) => set({ isCommandPaletteOpen: isOpen }),
    setSidebarCollapsed: (isCollapsed) => set({ isSidebarCollapsed: isCollapsed }),
    toggleSidebar: () => set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
    setFindWidgetOpen: (isOpen) => set({ iFindWidgetOpen: isOpen }),
    setFindReplaceMode: (isReplace) => set({ isFindReplaceMode: isReplace }),
    setSearchQuery: (query) => set({ searchQuery: query }),
    setSelectedNode: (node) => set({ selectedNode: node }),
    setCreationState: (state) => set({ creationState: state }),

    setRunConfigurations: (configs) => set({ runConfigurations: configs }),
    setActiveRunConfigId: (id) => set({ activeRunConfigId: id }),
    setRunConfigDialogOpen: (isOpen) => set({ isRunConfigDialogOpen: isOpen }),
    addRunConfiguration: (config) => set((state) => ({
        runConfigurations: [...state.runConfigurations, config],
        activeRunConfigId: config.id
    })),

    // Split Editor Actions
    splitEditorHorizontal: () => set((state) => {
        if (state.splitDirection !== 'none') return state;
        return {
            splitDirection: 'horizontal',
            editorGroups: [
                { id: 'group-1', activeFile: state.activeFile },
                { id: 'group-2', activeFile: null }
            ],
            activeGroupId: 'group-2'
        };
    }),

    splitEditorVertical: () => set((state) => {
        if (state.splitDirection !== 'none') return state;
        return {
            splitDirection: 'vertical',
            editorGroups: [
                { id: 'group-1', activeFile: state.activeFile },
                { id: 'group-2', activeFile: null }
            ],
            activeGroupId: 'group-2'
        };
    }),

    closeSplit: () => set((state) => {
        const primaryGroup = state.editorGroups[0];
        return {
            splitDirection: 'none',
            editorGroups: [{ id: 'group-1', activeFile: primaryGroup?.activeFile || state.activeFile }],
            activeGroupId: 'group-1',
            activeFile: primaryGroup?.activeFile || state.activeFile
        };
    }),

    setActiveGroup: (groupId) => set({ activeGroupId: groupId }),

    setGroupActiveFile: (groupId, filePath) => set((state) => ({
        editorGroups: state.editorGroups.map(group =>
            group.id === groupId ? { ...group, activeFile: filePath } : group
        ),
        activeFile: groupId === state.activeGroupId ? filePath : state.activeFile
    })),

    performSearch: async (query) => {
        const { projectPath } = get();
        if (!projectPath || !query.trim()) return;

        set({ isSearching: true, searchQuery: query });
        try {
            const results = await invoke<SearchResult[]>("search_in_files", {
                path: projectPath,
                query
            });
            set({ searchResults: results });
        } catch (e) {
            console.error("Search failed:", e);
            set({ searchResults: [] });
        } finally {
            set({ isSearching: false });
        }
    },

    refreshTree: async () => {
        const { projectPath } = get();
        if (!projectPath) return;
        try {
            const tree = await invoke<FileNode>("load_project_tree", { path: projectPath });
            set({ fileTree: tree });
        } catch (e) {
            console.error("Failed to refresh tree:", e);
        }
    },

    openProjectDialog: async () => {
        try {
            const selected = await open({
                directory: true,
                multiple: false,
                recursive: true,
            });

            if (selected && typeof selected === "string") {
                await get().openProjectByPath(selected);
            }
        } catch (err) {
            console.error("Failed to open project:", err);
        }
    },

    openProjectByPath: async (path: string) => {
        try {
            const tree = await invoke<FileNode>("load_project_tree", {
                path: path,
            });
            if (tree) {
                set({ fileTree: tree, projectPath: path });
                get().addRecentProject(path);
            }
        } catch (err) {
            console.error("Failed to open project:", err);
            const shouldRemove = await confirm(
                `The project at "${path}" could not be opened. It may have been moved or deleted.\n\nDo you want to remove it from the recent list?`,
                { title: "Project Not Found", kind: 'warning' }
            );
            if (shouldRemove) {
                get().removeRecentProject(path);
            }
        }
    },

    openFile: (file) => {
        // Emit file open event for plugins
        pluginEvents.emit('file:open', file.path);

        set((state) => {
            const exists = state.openFiles.find((f) => f.path === file.path);
            const newActiveFile = file.path;

            if (exists) {
                return {
                    activeFile: newActiveFile,
                    editorGroups: state.editorGroups.map(group =>
                        group.id === state.activeGroupId
                            ? { ...group, activeFile: newActiveFile }
                            : group
                    )
                };
            }
            return {
                openFiles: [...state.openFiles, file],
                activeFile: newActiveFile,
                editorGroups: state.editorGroups.map(group =>
                    group.id === state.activeGroupId
                        ? { ...group, activeFile: newActiveFile }
                        : group
                )
            };
        });
    },

    closeFile: (path) => set((state) => {
        const newOpenFiles = state.openFiles.filter((f) => f.path !== path);
        let newActiveFile = state.activeFile;

        if (state.activeFile === path) {
            newActiveFile = newOpenFiles.length > 0 ? newOpenFiles[newOpenFiles.length - 1].path : null;
        }

        return {
            openFiles: newOpenFiles,
            activeFile: newActiveFile
        };
    }),

    setActiveFile: (path) => set((state) => ({
        activeFile: path,
        editorGroups: state.editorGroups.map(group =>
            group.id === state.activeGroupId
                ? { ...group, activeFile: path }
                : group
        )
    })),

    updateFileContent: (path, content, markDirty = true) => {
        // Debounce file:change events to reduce plugin overhead
        // Clear existing debounce timer for this file
        const timerId = (window as any).__fileChangeTimers?.[path];
        if (timerId) clearTimeout(timerId);

        // Set new debounce timer (500ms delay)
        if (!(window as any).__fileChangeTimers) {
            (window as any).__fileChangeTimers = {};
        }
        (window as any).__fileChangeTimers[path] = setTimeout(() => {
            pluginEvents.emit('file:change', path, content);
            delete (window as any).__fileChangeTimers[path];
        }, 500);

        // Update state immediately (don't debounce state updates)
        set((state) => ({
            openFiles: state.openFiles.map((f) =>
                f.path === path ? { ...f, content, isDirty: markDirty ? true : f.isDirty } : f
            )
        }));
    },

    markFileDirty: (path, isDirty) => set((state) => ({
        openFiles: state.openFiles.map((f) =>
            f.path === path ? { ...f, isDirty } : f
        )
    })),

    renameFile: (oldPath, newPath) => set((state) => {
        const fileToRename = state.openFiles.find(f => f.path === oldPath);
        if (!fileToRename) return state;

        const newName = newPath.split(/[\/\\]/).pop() || newPath;
        const newOpenFiles = state.openFiles.map(f =>
            f.path === oldPath
                ? { ...f, path: newPath, name: newName }
                : f
        );

        const newActiveFile = state.activeFile === oldPath ? newPath : state.activeFile;

        return {
            openFiles: newOpenFiles,
            activeFile: newActiveFile,
            editorGroups: state.editorGroups.map(group =>
                group.activeFile === oldPath
                    ? { ...group, activeFile: newPath }
                    : group
            )
        };
    }),

    addRecentProject: (path) => set((state) => {
        const newRecent = [path, ...state.recentProjects.filter(p => p !== path)].slice(0, 10);
        localStorage.setItem('recentProjects', JSON.stringify(newRecent));
        return { recentProjects: newRecent };
    }),

    removeRecentProject: (path) => set((state) => {
        const newRecent = state.recentProjects.filter(p => p !== path);
        localStorage.setItem('recentProjects', JSON.stringify(newRecent));
        return { recentProjects: newRecent };
    }),
}));
