import type { StateCreator } from 'zustand';
import { type LayoutSlice, type EditorState } from '../types';

export const createLayoutSlice: StateCreator<EditorState, [], [], LayoutSlice> = (set) => ({
    activeView: 'explorer',
    splitDirection: 'none',
    editorGroups: [{ id: 'group-1', activeFile: null }],
    activeGroupId: 'group-1',
    isCommandPaletteOpen: false,
    isSidebarCollapsed: false,
    setActiveView: (view) => set({ activeView: view }),
    setCommandPaletteOpen: (isOpen) => set({ isCommandPaletteOpen: isOpen }),
    setSidebarCollapsed: (isCollapsed) => set({ isSidebarCollapsed: isCollapsed }),
    toggleSidebar: () => set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
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
    closeSplit: () => set((state) => ({
        splitDirection: 'none',
        editorGroups: [{ id: 'group-1', activeFile: state.activeFile }],
        activeGroupId: 'group-1'
    })),
    setActiveGroup: (groupId) => set({ activeGroupId: groupId }),
    setGroupActiveFile: (groupId, filePath) => set((state) => ({
        editorGroups: state.editorGroups.map(g =>
            g.id === groupId ? { ...g, activeFile: filePath } : g
        ),
        activeFile: groupId === state.activeGroupId ? filePath : state.activeFile
    })),
});
