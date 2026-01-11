import type { StateCreator } from 'zustand';
import { type SearchResult, type SearchSlice, type EditorState } from '../types';

export const createSearchSlice: StateCreator<EditorState, [], [], SearchSlice> = (set, get) => ({
    isFindWidgetOpen: false,
    isFindReplaceMode: false,
    searchResults: [],
    isSearching: false,
    searchQuery: "",
    setFindWidgetOpen: (isOpen) => set({ isFindWidgetOpen: isOpen }),
    setFindReplaceMode: (isReplace) => set({ isFindReplaceMode: isReplace }),
    setSearchQuery: (query) => set({ searchQuery: query }),
    performSearch: async (query) => {
        if (!query.trim()) {
            set({ searchResults: [] });
            return;
        }
        set({ isSearching: true });
        try {
            const { invoke } = await import('@tauri-apps/api/core');
            const { projectPath } = get();
            if (projectPath) {
                const results = await invoke<SearchResult[]>("search_in_files", {
                    path: projectPath,
                    query
                });
                set({ searchResults: results });
            }
        } catch (error) {
            console.error("Search failed:", error);
        } finally {
            set({ isSearching: false });
        }
    },
});
