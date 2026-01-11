import { create } from 'zustand';
import { invoke } from "@tauri-apps/api/core";
import { homeDir, join } from '@tauri-apps/api/path';
// import { exists, mkdir, BaseDirectory } from '@tauri-apps/plugin-fs';
import { useEditorStore } from './store';
type EventCallback = (...args: any[]) => void;
class PluginEventEmitter {
    private events: Map<string, Set<EventCallback>> = new Map();
    on(event: string, callback: EventCallback) {
        if (!this.events.has(event)) {
            this.events.set(event, new Set());
        }
        this.events.get(event)!.add(callback);
    }
    off(event: string, callback: EventCallback) {
        const callbacks = this.events.get(event);
        if (callbacks) {
            callbacks.delete(callback);
        }
    }
    emit(event: string, ...args: any[]) {
        const callbacks = this.events.get(event);
        if (callbacks) {
            callbacks.forEach(callback => {
                try {
                    callback(...args);
                } catch (error) {
                    console.error(`Error in event handler for ${event}:`, error);
                }
            });
        }
    }
    clear() {
        this.events.clear();
    }
}
export const pluginEvents = new PluginEventEmitter();
export interface PluginManifest {
    id: string;
    name: string;
    version: string;
    description?: string;
    author?: string;
    type: 'js' | 'rust';
    main: string;
    activation_events: string[];
    contributes?: Contributions;
    permissions: string[];
    enabled: boolean;
}
export interface Contributions {
    commands?: Command[];
    languages?: Language[];
    themes?: Theme[];
    views?: View[];
    keybindings?: Keybinding[];
}
export interface Command {
    id: string;
    title: string;
    category?: string;
    icon?: string;
}
export interface Language {
    id: string;
    extensions: string[];
    aliases?: string[];
}
export interface Theme {
    id: string;
    label: string;
    path: string;
}
export interface View {
    id: string;
    name: string;
    icon?: string;
}
export interface Keybinding {
    command: string;
    key: string;
    when?: string;
}
export interface LoadedPlugin {
    manifest: PluginManifest;
    path: string;
    content?: string;
    worker?: Worker;
    api?: PluginAPI;
}
export interface PluginAPI {
    executeCommand: (commandId: string, ...args: any[]) => Promise<any>;
    registerCommand: (commandId: string, handler: (...args: any[]) => any) => void;
    showMessage: (message: string, type: 'info' | 'warning' | 'error') => void;
    getActiveFile: () => string | null;
    getWorkspacePath: () => string | null;
    readFile: (path: string) => Promise<string>;
    writeFile: (path: string, content: string) => Promise<void>;
    getOpenFiles: () => string[];
    getFileContent: (path: string) => string | null;
    setStatusBarMessage: (message: string, timeout?: number) => void;
    onFileOpen: (callback: (path: string) => void) => void;
    onFileSave: (callback: (path: string) => void) => void;
    onFileChange: (callback: (path: string, content: string) => void) => void;
}
interface PluginState {
    availablePlugins: PluginManifest[];
    loadedPlugins: Map<string, LoadedPlugin>;
    pluginDir: string | null;
    isLoading: boolean;
    commands: Map<string, (...args: any[]) => any>;
    initializePluginSystem: () => Promise<void>;
    discoverPlugins: () => Promise<void>;
    loadPlugin: (pluginId: string) => Promise<void>;
    unloadPlugin: (pluginId: string) => Promise<void>;
    enablePlugin: (pluginId: string) => Promise<void>;
    disablePlugin: (pluginId: string) => Promise<void>;
    installPlugin: (pluginUrl: string, pluginId: string) => Promise<void>;
    uninstallPlugin: (pluginId: string) => Promise<void>;
    registerCommand: (commandId: string, handler: (...args: any[]) => any) => void;
    executeCommand: (commandId: string, ...args: any[]) => Promise<any>;
    createPluginAPI: (pluginId: string) => PluginAPI;
}
export const usePluginStore = create<PluginState>((set, get) => ({
    availablePlugins: [],
    loadedPlugins: new Map(),
    pluginDir: null,
    isLoading: false,
    commands: new Map(),
    initializePluginSystem: async () => {
        try {
            const home = await homeDir();
            const pluginDir = await join(home, '.mide', 'plugins');
            try {
                await invoke('ensure_plugin_dir', { pluginDir });
            } catch (err) {
                console.error('Failed to create plugin directory:', err);
                throw err;
            }
            set({ pluginDir });
            await get().discoverPlugins();
        } catch (err) {
            console.error('Failed to initialize plugin system:', err);
        }
    },
    discoverPlugins: async () => {
        const { pluginDir } = get();
        if (!pluginDir) return;
        set({ isLoading: true });
        try {
            const plugins = await invoke<PluginManifest[]>('discover_plugins', { pluginDir });
            set({ availablePlugins: plugins });
        } catch (err) {
            console.error('Failed to discover plugins:', err);
        } finally {
            set({ isLoading: false });
        }
    },
    loadPlugin: async (pluginId: string) => {
        const { pluginDir, loadedPlugins } = get();
        if (!pluginDir) return;
        try {
            const loaded = await invoke<LoadedPlugin>('load_plugin', { pluginDir, pluginId });
            if (loaded.manifest.type === 'js' && loaded.content) {
                const blob = new Blob([loaded.content], { type: 'application/javascript' });
                const workerUrl = URL.createObjectURL(blob);
                const worker = new Worker(workerUrl);
                const api = get().createPluginAPI(pluginId);
                worker.onmessage = (e) => {
                    const { type, data } = e.data;
                    if (type === 'registerCommand') {
                        get().registerCommand(data.commandId, (...args: any[]) => {
                            worker.postMessage({ type: 'executeCommand', commandId: data.commandId, args });
                        });
                    } else if (type === 'apiCall') {
                        const { method, args, callId } = data;
                        if (api && method in api) {
                            (api as any)[method](...args).then((result: any) => {
                                worker.postMessage({ type: 'apiResponse', callId, result });
                            }).catch((error: any) => {
                                worker.postMessage({ type: 'apiError', callId, error: error.message });
                            });
                        }
                    }
                };
                loaded.worker = worker;
                loaded.api = api;
                worker.postMessage({ type: 'activate', api });
            }
            const newLoaded = new Map(loadedPlugins);
            newLoaded.set(pluginId, loaded);
            set({ loadedPlugins: newLoaded });
        } catch (err) {
            console.error(`Failed to load plugin ${pluginId}:`, err);
        }
    },
    unloadPlugin: async (pluginId: string) => {
        const { loadedPlugins } = get();
        const plugin = loadedPlugins.get(pluginId);
        if (plugin?.worker) {
            plugin.worker.terminate();
        }
        const newLoaded = new Map(loadedPlugins);
        newLoaded.delete(pluginId);
        set({ loadedPlugins: newLoaded });
    },
    enablePlugin: async (pluginId: string) => {
        // TODO: Persist enabled state
        await get().loadPlugin(pluginId);
    },
    disablePlugin: async (pluginId: string) => {
        await get().unloadPlugin(pluginId);
    },
    installPlugin: async (pluginUrl: string, pluginId: string) => {
        const { pluginDir } = get();
        if (!pluginDir) return;
        set({ isLoading: true });
        try {
            await invoke('install_plugin', { pluginDir, pluginUrl, pluginId });
            await get().discoverPlugins();
        } catch (err) {
            console.error('Failed to install plugin:', err);
            throw err;
        } finally {
            set({ isLoading: false });
        }
    },
    uninstallPlugin: async (pluginId: string) => {
        const { pluginDir } = get();
        if (!pluginDir) return;
        set({ isLoading: true });
        try {
            await get().unloadPlugin(pluginId);
            await invoke('uninstall_plugin', { pluginDir, pluginId });
            await get().discoverPlugins();
        } catch (err) {
            console.error('Failed to uninstall plugin:', err);
            throw err;
        } finally {
            set({ isLoading: false });
        }
    },
    registerCommand: (commandId: string, handler: (...args: any[]) => any) => {
        const { commands } = get();
        const newCommands = new Map(commands);
        newCommands.set(commandId, handler);
        set({ commands: newCommands });
    },
    executeCommand: async (commandId: string, ...args: any[]) => {
        const { commands } = get();
        const handler = commands.get(commandId);
        if (handler) {
            return await handler(...args);
        }
        throw new Error(`Command ${commandId} not found`);
    },
    createPluginAPI: (_pluginId: string): PluginAPI => {
        return {
            executeCommand: async (commandId: string, ...args: any[]) => {
                return await get().executeCommand(commandId, ...args);
            },
            registerCommand: (commandId: string, handler: (...args: any[]) => any) => {
                get().registerCommand(commandId, handler);
            },
            showMessage: (message: string, type: 'info' | 'warning' | 'error') => {
                // TODO: Integrate with UI notification system
                console.log(`[${type.toUpperCase()}] ${message}`);
            },
            getActiveFile: () => {
                const editorState = useEditorStore.getState();
                return editorState.activeFile;
            },
            getWorkspacePath: () => {
                const editorState = useEditorStore.getState();
                return editorState.projectPath;
            },
            readFile: async (path: string) => {
                return await invoke<string>('read_file_content', { path });
            },
            writeFile: async (path: string, content: string) => {
                await invoke('save_file_content', { path, content });
                pluginEvents.emit('file:save', path);
            },
            getOpenFiles: () => {
                const editorState = useEditorStore.getState();
                return editorState.openFiles.map(f => f.path);
            },
            getFileContent: (path: string) => {
                const editorState = useEditorStore.getState();
                const file = editorState.openFiles.find(f => f.path === path);
                return file?.content || null;
            },
            setStatusBarMessage: (message: string, timeout?: number) => {
                // TODO: Integrate with StatusBar component
                console.log(`[STATUS] ${message}`);
                if (timeout) {
                    setTimeout(() => console.log('[STATUS] Cleared'), timeout);
                }
            },
            onFileOpen: (callback: (path: string) => void) => {
                pluginEvents.on('file:open', callback);
            },
            onFileSave: (callback: (path: string) => void) => {
                pluginEvents.on('file:save', callback);
            },
            onFileChange: (callback: (path: string, content: string) => void) => {
                pluginEvents.on('file:change', callback);
            },
        };
    },
}));