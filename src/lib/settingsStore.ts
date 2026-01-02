import { create } from 'zustand';
import { persist } from 'zustand/middleware';
export interface EditorSettings {
    fontSize: number;
    fontFamily: string;
    theme: 'vs-dark' | 'light';
    wordWrap: 'on' | 'off';
    minimap: boolean;
    lineNumbers: 'on' | 'off';
    tabSize: number;
    autoSave: boolean;
}
interface SettingsState {
    settings: EditorSettings;
    updateSettings: (newSettings: Partial<EditorSettings>) => void;
}
export const useSettingsStore = create<SettingsState>()(
    persist(
        (set) => ({
            settings: {
                fontSize: 14,
                fontFamily: "'Fira Code', monospace",
                theme: 'vs-dark',
                wordWrap: 'off',
                minimap: true,
                lineNumbers: 'on',
                tabSize: 2,
                autoSave: false,
            },
            updateSettings: (newSettings) =>
                set((state) => ({
                    settings: { ...state.settings, ...newSettings },
                })),
        }),
        {
            name: 'mide-settings',
        }
    )
);