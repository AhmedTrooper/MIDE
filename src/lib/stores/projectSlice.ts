import type { StateCreator } from 'zustand';
import { type ProjectSlice, type EditorState } from '../types';

export const createProjectSlice: StateCreator<EditorState, [], [], ProjectSlice> = (set, get) => ({
    projectPath: null,
    recentProjects: JSON.parse(localStorage.getItem('recentProjects') || '[]'),
    selectedNode: null,
    creationState: null,
    setProjectPath: (path) => set({ projectPath: path }),
    addRecentProject: (path) => set((state) => {
        const updated = [path, ...state.recentProjects.filter(p => p !== path)].slice(0, 10);
        localStorage.setItem('recentProjects', JSON.stringify(updated));
        return { recentProjects: updated };
    }),
    removeRecentProject: (path) => set((state) => {
        const updated = state.recentProjects.filter(p => p !== path);
        localStorage.setItem('recentProjects', JSON.stringify(updated));
        return { recentProjects: updated };
    }),
    setSelectedNode: (node) => set({ selectedNode: node }),
    setCreationState: (state) => set({ creationState: state }),
    openProjectDialog: async () => {
        try {
            const { open } = await import('@tauri-apps/plugin-dialog');
            const selected = await open({
                directory: true,
                multiple: false,
            });
            if (selected && typeof selected === 'string') {
                get().openProjectByPath(selected);
            }
        } catch (err) {
            console.error("Failed to open project dialog:", err);
        }
    },
    openProjectByPath: async (path: string) => {
        const { setProjectPath, addRecentProject, refreshTree } = get();
        setProjectPath(path);
        addRecentProject(path);
        await refreshTree();
    },
});
