import type { StateCreator } from 'zustand';
import { type RunSlice, type EditorState } from '../types';

export const createRunSlice: StateCreator<EditorState, [], [], RunSlice> = (set) => ({
    runConfigurations: [
        { id: 'default', name: 'Echo Hello', command: 'echo', args: ['Hello', 'World'] }
    ],
    activeRunConfigId: 'default',
    isRunConfigDialogOpen: false,
    adbDevices: [],
    avdList: [],
    setRunConfigurations: (configs) => set({ runConfigurations: configs }),
    setActiveRunConfigId: (id) => set({ activeRunConfigId: id }),
    setRunConfigDialogOpen: (isOpen) => set({ isRunConfigDialogOpen: isOpen }),
    addRunConfiguration: (config) => set((state) => ({
        runConfigurations: [...state.runConfigurations, config],
        activeRunConfigId: config.id
    })),
    setAdbDevices: (devices) => set({ adbDevices: devices }),
    setAvdList: (avds) => set({ avdList: avds }),
});
