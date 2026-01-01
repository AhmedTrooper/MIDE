mod adb;
mod filesystem;
mod formatter;
mod gh;
mod git;
mod models;
mod plugins;
mod search;
mod terminal;
mod todos;

use adb::{adb_connect, adb_devices, adb_disconnect, emulator_list_avds, emulator_start};
use filesystem::{
    create_directory, create_file, delete_item, load_project_tree, read_dir, read_file_content,
    rename_item, save_file_content, search_in_files,
};
use formatter::{format_code, format_file};
use search::fuzzy_search_files;

use gh::{
    gh_api, gh_auth_login, gh_auth_logout, gh_auth_status, gh_browse, gh_browse_issue,
    gh_browse_pr, gh_gist_create, gh_gist_delete, gh_gist_list, gh_gist_view, gh_issue_close,
    gh_issue_comment, gh_issue_create, gh_issue_list, gh_issue_reopen, gh_issue_view,
    gh_pr_checkout, gh_pr_checks, gh_pr_close, gh_pr_create, gh_pr_diff, gh_pr_list, gh_pr_merge,
    gh_pr_reopen, gh_pr_review, gh_pr_view, gh_release_create, gh_release_delete,
    gh_release_download, gh_release_list, gh_release_view, gh_repo_clone, gh_repo_create,
    gh_repo_fork, gh_repo_sync, gh_repo_view, gh_run_cancel, gh_run_list, gh_run_rerun,
    gh_run_view, gh_run_watch, gh_status, gh_workflow_disable, gh_workflow_enable,
    gh_workflow_list, gh_workflow_run, gh_workflow_view,
};
use git::{
    git_add, git_add_remote, git_blame, git_branches, git_checkout_branch, git_cherry_pick,
    git_clean, git_clone, git_commit, git_commit_amend, git_compare_branches, git_config_get,
    git_config_list, git_config_set, git_create_branch, git_create_tag, git_current_branch,
    git_delete_branch, git_delete_tag, git_diff, git_discard, git_fetch, git_file_history,
    git_init, git_list_conflicts, git_log, git_merge, git_pull, git_push, git_push_tag, git_rebase,
    git_rebase_abort, git_rebase_continue, git_reflog, git_remotes, git_remove_remote, git_reset,
    git_resolve_conflict, git_revert, git_search_commits, git_show, git_stash, git_stash_apply,
    git_stash_clear, git_stash_drop, git_stash_list, git_stash_pop, git_status_check,
    git_status_full, git_tags, git_unstage,
};
use plugins::{
    discover_plugins, ensure_plugin_dir, get_plugin_content, install_plugin, load_plugin,
    uninstall_plugin,
};
use std::env;
use terminal::{
    detect_virtual_environments, execute_shell_command, kill_terminal_process, run_command,
};
use todos::search_todos;

#[tauri::command]
fn get_cli_args() -> Vec<String> {
    env::args().collect()
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            load_project_tree,
            read_file_content,
            save_file_content,
            create_file,
            create_directory,
            delete_item,
            rename_item,
            search_in_files,
            fuzzy_search_files,
            run_command,
            read_dir,
            kill_terminal_process,
            execute_shell_command,
            detect_virtual_environments,
            git_status_check,
            git_status_full,
            git_add,
            git_unstage,
            git_discard,
            git_commit,
            git_commit_amend,
            git_diff,
            git_log,
            git_branches,
            git_create_branch,
            git_checkout_branch,
            git_delete_branch,
            git_merge,
            git_pull,
            git_push,
            git_fetch,
            git_remotes,
            git_add_remote,
            git_remove_remote,
            git_stash,
            git_stash_pop,
            git_stash_list,
            git_stash_apply,
            git_stash_drop,
            git_stash_clear,
            git_init,
            git_clone,
            git_tags,
            git_create_tag,
            git_delete_tag,
            git_push_tag,
            git_reset,
            git_revert,
            git_rebase,
            git_rebase_abort,
            git_rebase_continue,
            git_cherry_pick,
            git_blame,
            git_show,
            git_file_history,
            git_compare_branches,
            git_reflog,
            git_clean,
            git_list_conflicts,
            git_resolve_conflict,
            git_config_get,
            git_config_set,
            git_config_list,
            git_current_branch,
            git_search_commits,
            // GitHub CLI commands
            gh_auth_status,
            gh_auth_login,
            gh_auth_logout,
            gh_repo_view,
            gh_repo_create,
            gh_repo_fork,
            gh_repo_clone,
            gh_repo_sync,
            gh_pr_list,
            gh_pr_view,
            gh_pr_create,
            gh_pr_checkout,
            gh_pr_merge,
            gh_pr_close,
            gh_pr_reopen,
            gh_pr_review,
            gh_pr_diff,
            gh_pr_checks,
            gh_issue_list,
            gh_issue_view,
            gh_issue_create,
            gh_issue_close,
            gh_issue_reopen,
            gh_issue_comment,
            gh_release_list,
            gh_release_view,
            gh_release_create,
            gh_release_delete,
            gh_release_download,
            gh_workflow_list,
            gh_workflow_view,
            gh_workflow_run,
            gh_workflow_enable,
            gh_workflow_disable,
            gh_run_list,
            gh_run_view,
            gh_run_watch,
            gh_run_rerun,
            gh_run_cancel,
            gh_gist_list,
            gh_gist_view,
            gh_gist_create,
            gh_gist_delete,
            gh_browse,
            gh_browse_pr,
            gh_browse_issue,
            gh_status,
            gh_api,
            // TODO scanner
            search_todos,
            // Code formatter
            format_code,
            format_file,
            get_cli_args,
            adb_devices,
            adb_connect,
            adb_disconnect,
            emulator_list_avds,
            emulator_start,
            // Plugin System
            ensure_plugin_dir,
            discover_plugins,
            load_plugin,
            install_plugin,
            uninstall_plugin,
            get_plugin_content
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
