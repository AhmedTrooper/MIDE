mod filesystem;
mod git;
mod models;
mod terminal;

use filesystem::{
    create_directory, create_file, delete_item, load_project_tree, read_file_content, rename_item,
    save_file_content, search_in_files,
};
use git::{git_add, git_commit, git_status_check};
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
            git_add,
            git_commit,
            get_cli_args
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
