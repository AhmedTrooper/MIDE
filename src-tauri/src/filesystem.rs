use crate::models::{FileNode, SearchResult};
use std::fs;
use std::path::Path;
use walkdir::WalkDir;

// --- Recursive Logic ---
fn get_file_node(path: &Path) -> Option<FileNode> {
    let metadata = fs::metadata(path).ok()?;
    let name = path.file_name()?.to_string_lossy().to_string();
    let path_str = path.to_string_lossy().to_string();
    let is_dir = metadata.is_dir();

    Some(FileNode {
        name,
        path: path_str,
        is_dir,
        children: None,
    })
}

// --- Commands ---

#[tauri::command]
pub fn load_project_tree(path: String) -> Option<FileNode> {
    // Just return the root node, children will be loaded via read_dir
    get_file_node(Path::new(&path))
}

#[tauri::command]
pub fn read_dir(path: String) -> Result<Vec<FileNode>, String> {
    let path_obj = Path::new(&path);
    if !path_obj.exists() || !path_obj.is_dir() {
        return Err("Invalid directory".to_string());
    }

    let mut child_nodes = Vec::new();
    if let Ok(entries) = fs::read_dir(path_obj) {
        for entry in entries.flatten() {
            let entry_path = entry.path();
            if let Some(node) = get_file_node(&entry_path) {
                child_nodes.push(node);
            }
        }
    }
    // Sort: Folders first
    child_nodes.sort_by(|a, b| b.is_dir.cmp(&a.is_dir).then(a.name.cmp(&b.name)));

    Ok(child_nodes)
}

#[tauri::command]
pub fn read_file_content(path: String) -> Result<String, String> {
    fs::read_to_string(&path).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn save_file_content(path: String, content: String) -> Result<(), String> {
    fs::write(&path, content).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn create_file(path: String) -> Result<(), String> {
    if Path::new(&path).exists() {
        return Err("File already exists".to_string());
    }
    fs::write(&path, "").map_err(|e| e.to_string())
}

#[tauri::command]
pub fn create_directory(path: String) -> Result<(), String> {
    if Path::new(&path).exists() {
        return Err("Directory already exists".to_string());
    }
    fs::create_dir_all(&path).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_item(path: String) -> Result<(), String> {
    let path_obj = Path::new(&path);
    if path_obj.is_dir() {
        fs::remove_dir_all(path).map_err(|e| e.to_string())
    } else {
        fs::remove_file(path).map_err(|e| e.to_string())
    }
}

#[tauri::command]
pub fn rename_item(old_path: String, new_path: String) -> Result<(), String> {
    fs::rename(old_path, new_path).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn search_in_files(path: String, query: String) -> Result<Vec<SearchResult>, String> {
    let mut results = Vec::new();
    let query = query.to_lowercase();

    for entry in WalkDir::new(&path).into_iter().filter_map(|e| e.ok()) {
        let path = entry.path();
        if path.is_file() {
            if let Ok(content) = fs::read_to_string(path) {
                for (i, line) in content.lines().enumerate() {
                    if line.to_lowercase().contains(&query) {
                        results.push(SearchResult {
                            file: path.to_string_lossy().to_string(),
                            line: i + 1,
                            content: line.trim().to_string(),
                        });
                        if results.len() > 1000 {
                            return Ok(results);
                        }
                    }
                }
            }
        }
    }
    Ok(results)
}
