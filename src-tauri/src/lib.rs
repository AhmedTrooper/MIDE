use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;

// --- 1. Data Structure ---
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct FileNode {
    name: String,
    path: String,
    is_dir: bool,
    children: Option<Vec<FileNode>>,
}

// --- 2. Recursive Logic ---
fn get_file_tree_recursive(path: &Path) -> Option<FileNode> {
    let metadata = fs::metadata(path).ok()?;
    let name = path.file_name()?.to_string_lossy().to_string();
    let path_str = path.to_string_lossy().to_string();
    let is_dir = metadata.is_dir();

    let mut children = None;

    if is_dir {
        let mut child_nodes = Vec::new();
        if let Ok(entries) = fs::read_dir(path) {
            for entry in entries.flatten() {
                let entry_path = entry.path();
                let entry_name = entry.file_name().to_string_lossy().to_string();

                // SKIP heavy folders to prevent freezing
                if entry_name == "node_modules" || entry_name == ".git" {
                    continue;
                }

                if let Some(node) = get_file_tree_recursive(&entry_path) {
                    child_nodes.push(node);
                }
            }
        }
        // Sort: Folders first
        child_nodes.sort_by(|a, b| b.is_dir.cmp(&a.is_dir).then(a.name.cmp(&b.name)));

        if !child_nodes.is_empty() {
            children = Some(child_nodes);
        }
    }

    Some(FileNode {
        name,
        path: path_str,
        is_dir,
        children,
    })
}

// --- 3. Commands ---

#[tauri::command]
fn load_project_tree(path: String) -> Option<FileNode> {
    get_file_tree_recursive(Path::new(&path))
}

#[tauri::command]
fn read_file_content(path: String) -> Result<String, String> {
    // Reads file using Rust native FS (Bypasses frontend sandbox)
    fs::read_to_string(&path).map_err(|e| e.to_string())
}

#[tauri::command]
fn save_file_content(path: String, content: String) -> Result<(), String> {
    fs::write(&path, content).map_err(|e| e.to_string())
}

#[tauri::command]
fn create_file(path: String) -> Result<(), String> {
    if Path::new(&path).exists() {
        return Err("File already exists".to_string());
    }
    fs::write(&path, "").map_err(|e| e.to_string())
}

#[tauri::command]
fn create_directory(path: String) -> Result<(), String> {
    if Path::new(&path).exists() {
        return Err("Directory already exists".to_string());
    }
    fs::create_dir_all(&path).map_err(|e| e.to_string())
}

#[tauri::command]
fn delete_item(path: String) -> Result<(), String> {
    let path_obj = Path::new(&path);
    if path_obj.is_dir() {
        fs::remove_dir_all(path).map_err(|e| e.to_string())
    } else {
        fs::remove_file(path).map_err(|e| e.to_string())
    }
}

#[tauri::command]
fn rename_item(old_path: String, new_path: String) -> Result<(), String> {
    fs::rename(old_path, new_path).map_err(|e| e.to_string())
}

// --- 4. Main Entry ---
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![
            load_project_tree,
            read_file_content,
            save_file_content,
            create_file,
            create_directory,
            delete_item,
            rename_item
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
