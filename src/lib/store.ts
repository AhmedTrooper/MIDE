import { create } from 'zustand';
import { createFileSlice } from './stores/fileSlice';
import { createTerminalSlice } from './stores/terminalSlice';
import { createLayoutSlice } from './stores/layoutSlice';
import { createSearchSlice } from './stores/searchSlice';
import { createProjectSlice } from './stores/projectSlice';
import { createRunSlice } from './stores/runSlice';
import { createGitSlice } from './stores/gitSlice';
import { type EditorState } from './types';

// Re-export common types
export * from './types';

// Create the combined store
export const useEditorStore = create<EditorState>((...a) => ({
    ...createFileSlice(...a),
    ...createTerminalSlice(...a),
    ...createLayoutSlice(...a),
    ...createSearchSlice(...a),
    ...createProjectSlice(...a),
    ...createRunSlice(...a),
    ...createGitSlice(...a),
}));