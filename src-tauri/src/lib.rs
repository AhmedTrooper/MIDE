mod adb;
mod filesystem;
mod git;
mod models;
mod terminal;

use adb::{adb_connect, adb_devices, adb_disconnect, emulator_list_avds, emulator_start};
use filesystem::{
    create_directory, create_file, delete_item, load_project_tree, read_file_content, rename_item,
    save_file_content, search_in_files,
};
use git::{
    git_add, git_add_remote, git_branches, git_checkout_branch, git_clone, git_commit,
    git_commit_amend, git_create_branch, git_delete_branch, git_diff, git_discard, git_fetch,
    git_init, git_log, git_merge, git_pull, git_push, git_remotes, git_remove_remote, git_stash,
    git_stash_list, git_stash_pop, git_status_check, git_status_full, git_unstage,
};
use std::env;
use terminal::{execute_shell_command, run_command};

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
            run_command,
            execute_shell_command,
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
            git_init,
            git_clone,
            get_cli_args,
            adb_devices,
            adb_connect,
            adb_disconnect,
            emulator_list_avds,
            emulator_start
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
