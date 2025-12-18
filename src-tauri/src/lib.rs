mod filesystem;
mod git;
mod models;
mod terminal;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![
            filesystem::load_project_tree,
            filesystem::read_file_content,
            filesystem::save_file_content,
            filesystem::create_file,
            filesystem::create_directory,
            filesystem::delete_item,
            filesystem::rename_item,
            filesystem::search_in_files,
            terminal::run_command,
            terminal::execute_shell_command,
            git::get_git_status,
            git::git_add,
            git::git_commit
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
