import type { StateCreator } from 'zustand';
import { type FileSlice, type EditorState } from '../types';
import { type FileNode } from '../../components/ui/FileTree';

export const createFileSlice: StateCreator<EditorState, [], [], FileSlice> = (set, get) => ({
    fileTree: null,
    openFiles: [],
    activeFile: null,
    setFileTree: (tree) => set({ fileTree: tree }),
    openFile: (file) => set((state) => {
        const existing = state.openFiles.find((f) => f.path === file.path);
        const newFiles = existing
            ? state.openFiles.map(f => f.path === file.path ? { ...f, ...file } : f)
            : [...state.openFiles, file];

        // Update active group's file
        const newGroups = state.editorGroups.map(g =>
            g.id === state.activeGroupId
                ? { ...g, activeFile: file.path }
                : g
        );

        return {
            openFiles: newFiles,
            activeFile: file.path,
            editorGroups: newGroups,
        };
    }),
    closeFile: (path) => set((state) => {
        const newFiles = state.openFiles.filter((f) => f.path !== path);

        // Use a Set to track processed groups to update
        const newGroups = state.editorGroups.map(g => {
            if (g.activeFile === path) {
                // Determine new active file for this group (simple logic: last opened)
                const remainingFiles = newFiles;
                return {
                    ...g,
                    activeFile: remainingFiles.length > 0 ? remainingFiles[remainingFiles.length - 1].path : null
                };
            }
            return g;
        });

        // Update global active file if it was closed
        let newActiveFile = state.activeFile;
        if (state.activeFile === path) {
            const activeGroup = newGroups.find(g => g.id === state.activeGroupId);
            newActiveFile = activeGroup?.activeFile || null;
        }

        return {
            openFiles: newFiles,
            editorGroups: newGroups,
            activeFile: newActiveFile
        };
    }),
    setActiveFile: (path) => set((state) => ({
        activeFile: path,
        editorGroups: state.editorGroups.map(g =>
            g.id === state.activeGroupId ? { ...g, activeFile: path } : g
        )
    })),
    updateFileContent: (path, content, markDirty = true) => set((state) => ({
        openFiles: state.openFiles.map((f) =>
            f.path === path ? { ...f, content, isDirty: markDirty ? true : f.isDirty } : f
        ),
    })),
    markFileDirty: (path, isDirty) => set((state) => ({
        openFiles: state.openFiles.map((f) =>
            f.path === path ? { ...f, isDirty } : f
        ),
    })),
    renameFile: (oldPath, newPath) => set((state) => ({
        openFiles: state.openFiles.map((f) =>
            f.path === oldPath ? { ...f, path: newPath, name: newPath.split('/').pop() || newPath } : f
        ),
        activeFile: state.activeFile === oldPath ? newPath : state.activeFile,
    })),
    refreshTree: async () => {
        const { projectPath, setFileTree } = get();
        if (projectPath) {
            try {
                const { invoke } = await import('@tauri-apps/api/core');
                const tree = await invoke<FileNode>("load_project_tree", { path: projectPath });
                setFileTree(tree);
            } catch (e) {
                console.error("Failed to refresh tree", e);
            }
        }
    },
});
