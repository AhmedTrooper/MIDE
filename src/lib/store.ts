import { create } from 'zustand';
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { type FileNode } from '../components/ui/FileTree';

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

interface EditorState {
    fileTree: FileNode | null;
    openFiles: OpenFile[];
    activeFile: string | null;
    activeView: string; // 'explorer', 'search', etc.
    projectPath: string | null;
    isCommandPaletteOpen: boolean;
    isTerminalOpen: boolean;
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
    terminalOutput: string[];
    appendTerminalOutput: (line: string) => void;
    clearTerminalOutput: () => void;

    setFileTree: (tree: FileNode) => void;
    setProjectPath: (path: string) => void;
    setActiveView: (view: string) => void;
    setCommandPaletteOpen: (isOpen: boolean) => void;
    setTerminalOpen: (isOpen: boolean) => void;
    toggleTerminal: () => void;
    openFile: (file: OpenFile) => void;
    closeFile: (path: string) => void;
    setActiveFile: (path: string) => void;
    updateFileContent: (path: string, content: string) => void;
    markFileDirty: (path: string, isDirty: boolean) => void;
    refreshTree: () => Promise<void>;
    openProjectDialog: () => Promise<void>;
    performSearch: (query: string) => Promise<void>;
    setSearchQuery: (query: string) => void;
    setSelectedNode: (node: { path: string; isDir: boolean } | null) => void;
    setCreationState: (state: { type: 'file' | 'folder'; parentPath: string } | null) => void;

    // Run Configuration Actions
    setRunConfigurations: (configs: RunConfiguration[]) => void;
    setActiveRunConfigId: (id: string | null) => void;
    setRunConfigDialogOpen: (isOpen: boolean) => void;
    addRunConfiguration: (config: RunConfiguration) => void;
}

export const useEditorStore = create<EditorState>((set, get) => ({
    fileTree: null,
    openFiles: [],
    activeFile: null,
    activeView: 'explorer',
    projectPath: null,
    isCommandPaletteOpen: false,
    isTerminalOpen: true,
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

    terminalOutput: [],
    appendTerminalOutput: (line) => set((state) => ({ terminalOutput: [...state.terminalOutput, line] })),
    clearTerminalOutput: () => set({ terminalOutput: [] }),

    setFileTree: (tree) => set({ fileTree: tree }),
    setProjectPath: (path) => set({ projectPath: path }),
    setActiveView: (view) => set({ activeView: view }),
    setCommandPaletteOpen: (isOpen) => set({ isCommandPaletteOpen: isOpen }),
    setTerminalOpen: (isOpen) => set({ isTerminalOpen: isOpen }),
    toggleTerminal: () => set((state) => ({ isTerminalOpen: !state.isTerminalOpen })),
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
                const tree = await invoke<FileNode>("load_project_tree", {
                    path: selected,
                });
                if (tree) {
                    set({ fileTree: tree, projectPath: selected });
                }
            }
        } catch (err) {
            console.error("Failed to open project:", err);
        }
    },

    openFile: (file) => set((state) => {
        const exists = state.openFiles.find((f) => f.path === file.path);
        if (exists) {
            return { activeFile: file.path };
        }
        return {
            openFiles: [...state.openFiles, file],
            activeFile: file.path
        };
    }),

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

    setActiveFile: (path) => set({ activeFile: path }),

    updateFileContent: (path, content) => set((state) => ({
        openFiles: state.openFiles.map((f) =>
            f.path === path ? { ...f, content, isDirty: true } : f
        )
    })),

    markFileDirty: (path, isDirty) => set((state) => ({
        openFiles: state.openFiles.map((f) =>
            f.path === path ? { ...f, isDirty } : f
        )
    })),
}));
