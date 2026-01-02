use tauri::Manager;
use std::process::Command;
#[tauri::command]
pub fn open_path(path: String) -> Result<(), String> {
    let result = if cfg!(target_os = "windows") {
        Command::new("cmd")
            .args(["/C", "start", "", &path])
            .spawn()
    } else if cfg!(target_os = "macos") {
        Command::new("open")
            .arg(&path)
            .spawn()
    } else {
        Command::new("xdg-open")
            .arg(&path)
            .spawn()
    };
    match result {
        Ok(_) => Ok(()),
        Err(e) => Err(format!("Failed to open path: {}", e)),
    }
}