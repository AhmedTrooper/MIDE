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

interface EditorState {
    fileTree: FileNode | null;
    openFiles: OpenFile[];
    activeFile: string | null;
    activeView: string; // 'explorer', 'search', etc.
    projectPath: string | null;

    setFileTree: (tree: FileNode) => void;
    setProjectPath: (path: string) => void;
    setActiveView: (view: string) => void;
    openFile: (file: OpenFile) => void;
    closeFile: (path: string) => void;
    setActiveFile: (path: string) => void;
    updateFileContent: (path: string, content: string) => void;
    markFileDirty: (path: string, isDirty: boolean) => void;
    refreshTree: () => Promise<void>;
    openProjectDialog: () => Promise<void>;
}

export const useEditorStore = create<EditorState>((set, get) => ({
    fileTree: null,
    openFiles: [],
    activeFile: null,
    activeView: 'explorer',
    projectPath: null,

    setFileTree: (tree) => set({ fileTree: tree }),
    setProjectPath: (path) => set({ projectPath: path }),
    setActiveView: (view) => set({ activeView: view }),

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
