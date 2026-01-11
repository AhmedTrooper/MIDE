import type { StateCreator } from 'zustand';
import { type GitSlice, type EditorState, type GitStatus, type GitBranch, type GitCommitInfo, type GitRemote } from '../types';

export const createGitSlice: StateCreator<EditorState, [], [], GitSlice> = (set, get) => ({
    gitStatus: null,
    gitBranches: [],
    currentBranch: null,
    gitCommits: [],
    gitRemotes: [],
    isGitLoading: false,

    refreshGitStatus: async () => {
        const { projectPath } = get();
        if (!projectPath) return;
        try {
            const { invoke } = await import('@tauri-apps/api/core');
            const status = await invoke<GitStatus>("git_status_full", { cwd: projectPath });
            set({ gitStatus: status });
            // Also refresh branches and current branch as they might change
            await get().refreshGitBranches();
        } catch (error) {
            console.error("Failed to refresh git status:", error);
            set({ gitStatus: null });
        }
    },

    refreshGitBranches: async () => {
        const { projectPath } = get();
        if (!projectPath) return;
        try {
            const { invoke } = await import('@tauri-apps/api/core');
            const branches = await invoke<GitBranch[]>("git_branches", { cwd: projectPath });
            const current = branches.find(b => b.current)?.name || null;
            set({ gitBranches: branches, currentBranch: current });
        } catch (error) {
            console.error("Failed to refresh git branches:", error);
        }
    },

    refreshGitCommits: async () => {
        const { projectPath } = get();
        if (!projectPath) return;
        try {
            const { invoke } = await import('@tauri-apps/api/core');
            const commits = await invoke<GitCommitInfo[]>("git_log", { cwd: projectPath, limit: 50 });
            set({ gitCommits: commits });
        } catch (error) {
            console.error("Failed to refresh git commits:", error);
        }
    },

    refreshGitRemotes: async () => {
        const { projectPath } = get();
        if (!projectPath) return;
        try {
            const { invoke } = await import('@tauri-apps/api/core');
            const remotes = await invoke<GitRemote[]>("git_remotes", { cwd: projectPath });
            set({ gitRemotes: remotes });
        } catch (error) {
            console.error("Failed to refresh git remotes:", error);
        }
    },

    checkIfGitRepo: async () => {
        const { projectPath } = get();
        if (!projectPath) return false;
        try {
            const { invoke } = await import('@tauri-apps/api/core');
            await invoke("git_status_full", { cwd: projectPath });
            return true;
        } catch {
            return false;
        }
    },

    gitInit: async () => {
        const { projectPath } = get();
        if (!projectPath) return;
        try {
            const { invoke } = await import('@tauri-apps/api/core');
            await invoke("git_init", { cwd: projectPath });
            await get().refreshGitStatus();
        } catch (error) {
            console.error("Failed to init git:", error);
            throw error;
        }
    },

    stageFile: async (path: string) => {
        const { projectPath, refreshGitStatus } = get();
        if (!projectPath) return;
        try {
            const { invoke } = await import('@tauri-apps/api/core');
            await invoke("git_add", { cwd: projectPath, files: [path] });
            await refreshGitStatus();
        } catch (error) {
            console.error(`Failed to stage ${path}:`, error);
        }
    },

    unstageFile: async (path: string) => {
        const { projectPath, refreshGitStatus } = get();
        if (!projectPath) return;
        try {
            const { invoke } = await import('@tauri-apps/api/core');
            await invoke("git_unstage", { cwd: projectPath, files: [path] });
            await refreshGitStatus();
        } catch (error) {
            console.error(`Failed to unstage ${path}:`, error);
        }
    },

    commitChanges: async (message: string) => {
        const { projectPath, refreshGitStatus, refreshGitCommits } = get();
        if (!projectPath) return;
        set({ isGitLoading: true });
        try {
            const { invoke } = await import('@tauri-apps/api/core');
            await invoke("git_commit", { cwd: projectPath, message });
            await refreshGitStatus();
            await refreshGitCommits();
        } catch (error) {
            console.error("Failed to commit:", error);
            throw error;
        } finally {
            set({ isGitLoading: false });
        }
    },

    pushChanges: async () => {
        const { projectPath, currentBranch } = get();
        if (!projectPath) return;
        set({ isGitLoading: true });
        try {
            const { invoke } = await import('@tauri-apps/api/core');
            // Assuming push to origin current_branch by default or command handles it
            await invoke("git_push", {
                cwd: projectPath,
                set_upstream: false, // Default to false for now, maybe add arg later if needed
                branch: currentBranch || 'main'
            });
        } catch (error) {
            console.error("Failed to push:", error);
            throw error;
        } finally {
            set({ isGitLoading: false });
        }
    },

    pullChanges: async () => {
        const { projectPath, refreshGitStatus, refreshGitCommits } = get();
        if (!projectPath) return;
        set({ isGitLoading: true });
        try {
            const { invoke } = await import('@tauri-apps/api/core');
            await invoke("git_pull", { cwd: projectPath });
            await refreshGitStatus();
            await refreshGitCommits();
        } catch (error) {
            console.error("Failed to pull:", error);
            throw error;
        } finally {
            set({ isGitLoading: false });
        }
    },

    fetchChanges: async () => {
        const { projectPath, refreshGitStatus, refreshGitCommits, refreshGitBranches } = get();
        if (!projectPath) return;
        set({ isGitLoading: true });
        try {
            const { invoke } = await import('@tauri-apps/api/core');
            await invoke("git_fetch", { cwd: projectPath });
            await refreshGitStatus();
            await refreshGitCommits();
            await refreshGitBranches();
        } catch (error) {
            console.error("Failed to fetch:", error);
            throw error;
        } finally {
            set({ isGitLoading: false });
        }
    },

    amendCommit: async (message: string) => {
        const { projectPath, refreshGitStatus, refreshGitCommits } = get();
        if (!projectPath) return;
        set({ isGitLoading: true });
        try {
            const { invoke } = await import('@tauri-apps/api/core');
            await invoke("git_commit_amend", { cwd: projectPath, message });
            await refreshGitStatus();
            await refreshGitCommits();
        } catch (error) {
            console.error("Failed to amend commit:", error);
            throw error;
        } finally {
            set({ isGitLoading: false });
        }
    },

    switchBranch: async (branch: string) => {
        const { projectPath, refreshGitStatus, refreshGitBranches } = get();
        if (!projectPath) return;
        set({ isGitLoading: true });
        try {
            const { invoke } = await import('@tauri-apps/api/core');
            await invoke("git_checkout_branch", { cwd: projectPath, name: branch });
            await refreshGitStatus();
            await refreshGitBranches();
        } catch (error) {
            console.error(`Failed to checkout ${branch}:`, error);
            throw error;
        } finally {
            set({ isGitLoading: false });
        }
    },

    createBranch: async (name: string) => {
        const { projectPath, refreshGitBranches } = get();
        if (!projectPath) return;
        try {
            const { invoke } = await import('@tauri-apps/api/core');
            await invoke("git_create_branch", { cwd: projectPath, name });
            await refreshGitBranches();
        } catch (error) {
            console.error(`Failed to create branch ${name}:`, error);
            throw error;
        }
    }
});
