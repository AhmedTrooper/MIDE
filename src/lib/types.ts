import { type FileNode } from '../components/ui/FileTree';

export interface OpenFile {
    path: string;
    name: string;
    content: string;
    language: string;
    isDirty: boolean;
}

export interface SearchResult {
    file: string;
    line: number;
    content: string;
}

export interface RunConfiguration {
    id: string;
    name: string;
    command: string;
    args?: string[];
    cwd?: string;
}

export interface EditorGroup {
    id: string;
    activeFile: string | null;
}

export interface TerminalInstance {
    id: string;
    name: string;
    output: string[];
    cwd: string;
    isActive: boolean;
    venvActivated: boolean;
    venvPath?: string;
    isRunning: boolean;
}

export type SplitDirection = 'none' | 'horizontal' | 'vertical';

// --- Slice Interfaces ---

export interface TerminalSlice {
    terminals: TerminalInstance[];
    activeTerminalId: string | null;
    isTerminalOpen: boolean;
    isBottomPanelVisible: boolean;
    addTerminal: (cwd?: string, name?: string) => void;
    removeTerminal: (id: string) => void;
    setActiveTerminal: (id: string) => void;
    appendToTerminal: (id: string, line: string) => void;
    clearTerminal: (id: string) => void;
    updateTerminalName: (id: string, name: string) => void;
    updateTerminalCwd: (id: string, cwd: string) => void;
    activateVenvInTerminal: (id: string, venvPath: string) => void;
    setTerminalRunning: (id: string, isRunning: boolean) => void;
    setBottomPanelVisible: (isVisible: boolean) => void;
    toggleBottomPanel: () => void;
}

export interface FileSlice {
    fileTree: FileNode | null;
    openFiles: OpenFile[];
    activeFile: string | null;
    setFileTree: (tree: FileNode) => void;
    openFile: (file: OpenFile) => void;
    closeFile: (path: string) => void;
    setActiveFile: (path: string) => void;
    updateFileContent: (path: string, content: string, markDirty?: boolean) => void;
    markFileDirty: (path: string, isDirty: boolean) => void;
    renameFile: (oldPath: string, newPath: string) => void;
    refreshTree: () => Promise<void>;
}

export interface LayoutSlice {
    activeView: string;
    splitDirection: SplitDirection;
    editorGroups: EditorGroup[];
    activeGroupId: string;
    isCommandPaletteOpen: boolean;
    isSidebarCollapsed: boolean;
    setActiveView: (view: string) => void;
    setCommandPaletteOpen: (isOpen: boolean) => void;
    setSidebarCollapsed: (isCollapsed: boolean) => void;
    toggleSidebar: () => void;
    splitEditorHorizontal: () => void;
    splitEditorVertical: () => void;
    closeSplit: () => void;
    setActiveGroup: (groupId: string) => void;
    setGroupActiveFile: (groupId: string, filePath: string | null) => void;
}

export interface SearchSlice {
    isFindWidgetOpen: boolean;
    isFindReplaceMode: boolean;
    searchResults: SearchResult[];
    isSearching: boolean;
    searchQuery: string;
    setFindWidgetOpen: (isOpen: boolean) => void;
    setFindReplaceMode: (isReplace: boolean) => void;
    setSearchQuery: (query: string) => void;
    performSearch: (query: string) => Promise<void>;
}

export interface ProjectSlice {
    projectPath: string | null;
    recentProjects: string[];
    selectedNode: { path: string; isDir: boolean } | null;
    creationState: { type: 'file' | 'folder'; parentPath: string } | null;
    setProjectPath: (path: string) => void;
    addRecentProject: (path: string) => void;
    removeRecentProject: (path: string) => void;
    setSelectedNode: (node: { path: string; isDir: boolean } | null) => void;
    setCreationState: (state: { type: 'file' | 'folder'; parentPath: string } | null) => void;
    openProjectDialog: () => Promise<void>;
    openProjectByPath: (path: string) => Promise<void>;
}

export interface RunSlice {
    runConfigurations: RunConfiguration[];
    activeRunConfigId: string | null;
    isRunConfigDialogOpen: boolean;
    adbDevices: string[];
    avdList: string[];
    setRunConfigurations: (configs: RunConfiguration[]) => void;
    setActiveRunConfigId: (id: string) => void;
    setRunConfigDialogOpen: (isOpen: boolean) => void;
    addRunConfiguration: (config: RunConfiguration) => void;
    setAdbDevices: (devices: string[]) => void;
    setAvdList: (avds: string[]) => void;
}


// --- Git Interfaces ---

export interface GitFile {
    status: string;
    path: string;
}

export interface GitStatus {
    branch: string;
    files: GitFile[];
    ahead: number;
    behind: number;
}

export interface GitBranch {
    name: string;
    current: boolean;
    remote: string;
}

export interface GitCommitInfo {
    hash: string;
    author: string;
    email: string;
    timestamp: number;
    message: string;
    body: string;
}

export interface GitRemote {
    name: string;
    url: string;
}

export interface GitSlice {
    gitStatus: GitStatus | null;
    gitBranches: GitBranch[];
    currentBranch: string | null;
    gitCommits: GitCommitInfo[];
    gitRemotes: GitRemote[];
    isGitLoading: boolean;
    fetchChanges: () => Promise<void>;
    amendCommit: (message: string) => Promise<void>;
    refreshGitStatus: () => Promise<void>;
    refreshGitBranches: () => Promise<void>;
    refreshGitCommits: () => Promise<void>;
    refreshGitRemotes: () => Promise<void>;
    checkIfGitRepo: () => Promise<boolean>;
    gitInit: () => Promise<void>;
    stageFile: (path: string) => Promise<void>;
    unstageFile: (path: string) => Promise<void>;
    commitChanges: (message: string) => Promise<void>;
    pushChanges: () => Promise<void>;
    pullChanges: () => Promise<void>;
    switchBranch: (branch: string) => Promise<void>;
    createBranch: (name: string) => Promise<void>;
}

// Combined State
export type EditorState = FileSlice & TerminalSlice & LayoutSlice & SearchSlice & ProjectSlice & RunSlice & GitSlice;
