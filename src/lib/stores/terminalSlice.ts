import type { StateCreator } from 'zustand';
import { type TerminalInstance, type TerminalSlice, type EditorState } from '../types';

export const createTerminalSlice: StateCreator<EditorState, [], [], TerminalSlice> = (set) => ({
    terminals: [],
    activeTerminalId: null,
    isTerminalOpen: false,
    isBottomPanelVisible: false,
    addTerminal: (cwd?: string, name?: string) => set((state) => {
        const id = `terminal-${Date.now()}`;
        const terminalName = name || `Terminal ${state.terminals.length + 1}`;
        const workingDir = cwd || state.projectPath || '~';
        const newTerminal: TerminalInstance = {
            id,
            name: terminalName,
            output: [`Welcome to ${terminalName}`, `Working directory: ${workingDir}`, ''],
            cwd: workingDir,
            isActive: true, // Auto-activate new terminals
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
    setBottomPanelVisible: (isVisible) => set({ isBottomPanelVisible: isVisible }),
    toggleBottomPanel: () => set((state) => ({ isBottomPanelVisible: !state.isBottomPanelVisible })),
});
