use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;
use walkdir::WalkDir;
use tauri::{Emitter, Window};
use std::process::{Command, Stdio};
use std::io::{BufRead, BufReader};
use std::thread;
#[cfg(target_os = "windows")]
use std::os::windows::process::CommandExt;

// --- 1. Data Structure ---
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct SearchResult {
    file: String,
    line: usize,
    content: String,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct FileNode {
    name: String,
    path: String,
    is_dir: bool,
    children: Option<Vec<FileNode>>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct GitFile {
    path: String,
    status: String,
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

#[tauri::command]
fn search_in_files(path: String, query: String) -> Result<Vec<SearchResult>, String> {
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

#[tauri::command]
fn run_command(window: Window, id: String, command: String, args: Vec<String>, cwd: Option<String>) {
    thread::spawn(move || {
        let mut cmd = Command::new(command);
        cmd.args(args);
        if let Some(dir) = cwd {
            cmd.current_dir(dir);
        }
        
        #[cfg(target_os = "windows")]
        const CREATE_NO_WINDOW: u32 = 0x08000000;
        #[cfg(target_os = "windows")]
        cmd.creation_flags(CREATE_NO_WINDOW);

        cmd.stdout(Stdio::piped());
        cmd.stderr(Stdio::piped());

        match cmd.spawn() {
            Ok(mut child) => {
                let stdout = child.stdout.take().unwrap();
                let stderr = child.stderr.take().unwrap();

                let window_clone_out = window.clone();
                let id_clone_out = id.clone();
                thread::spawn(move || {
                    let reader = BufReader::new(stdout);
                    for line in reader.lines() {
                        if let Ok(l) = line {
                            let _ = window_clone_out.emit(&format!("term-data-{}", id_clone_out), l);
                        }
                    }
                });

                let window_clone_err = window.clone();
                let id_clone_err = id.clone();
                thread::spawn(move || {
                    let reader = BufReader::new(stderr);
                    for line in reader.lines() {
                        if let Ok(l) = line {
                            let _ = window_clone_err.emit(&format!("term-data-{}", id_clone_err), l);
                        }
                    }
                });

                let status = child.wait();
                match status {
                    Ok(s) => {
                        let _ = window.emit(&format!("term-exit-{}", id), s.code());
                    }
                    Err(e) => {
                        let _ = window.emit(&format!("term-error-{}", id), e.to_string());
                    }
                }
            }
            Err(e) => {
                let _ = window.emit(&format!("term-error-{}", id), e.to_string());
            }
        }
    });
}

#[tauri::command]
async fn execute_shell_command(command: String, args: Vec<String>, cwd: Option<String>) -> Result<String, String> {
    let mut cmd = Command::new(command);
    cmd.args(args);
    if let Some(dir) = cwd {
        cmd.current_dir(dir);
    }
    
    #[cfg(target_os = "windows")]
    const CREATE_NO_WINDOW: u32 = 0x08000000;
    #[cfg(target_os = "windows")]
    cmd.creation_flags(CREATE_NO_WINDOW);

    let output = cmd.output().map_err(|e| e.to_string())?;
    
    if output.status.success() {
        Ok(String::from_utf8_lossy(&output.stdout).to_string())
    } else {
        Err(String::from_utf8_lossy(&output.stderr).to_string())
    }
}

#[tauri::command]
fn git_status(cwd: String) -> Result<Vec<GitFile>, String> {
    let mut cmd = Command::new("git");
    cmd.args(&["status", "--porcelain"]);
    cmd.current_dir(&cwd);
    
    #[cfg(target_os = "windows")]
    const CREATE_NO_WINDOW: u32 = 0x08000000;
    #[cfg(target_os = "windows")]
    cmd.creation_flags(CREATE_NO_WINDOW);

    let output = cmd.output().map_err(|e| e.to_string())?;

    if !output.status.success() {
        return Err(String::from_utf8_lossy(&output.stderr).to_string());
    }

    let stdout = String::from_utf8_lossy(&output.stdout);
    let mut files = Vec::new();

    for line in stdout.lines() {
        if line.len() < 4 { continue; }
        let status = line[0..2].trim().to_string();
        let path = line[3..].to_string();
        files.push(GitFile { status, path });
    }

    Ok(files)
}

#[tauri::command]
fn git_add(cwd: String, files: Vec<String>) -> Result<(), String> {
    let mut cmd = Command::new("git");
    cmd.args(&["add"]);
    cmd.args(&files);
    cmd.current_dir(&cwd);
    
    #[cfg(target_os = "windows")]
    const CREATE_NO_WINDOW: u32 = 0x08000000;
    #[cfg(target_os = "windows")]
    cmd.creation_flags(CREATE_NO_WINDOW);
    
    let output = cmd.output().map_err(|e| e.to_string())?;
    if !output.status.success() {
        return Err(String::from_utf8_lossy(&output.stderr).to_string());
    }
    Ok(())
}

#[tauri::command]
fn git_commit(cwd: String, message: String) -> Result<(), String> {
    let mut cmd = Command::new("git");
    cmd.args(&["commit", "-m", &message]);
    cmd.current_dir(&cwd);
    
    #[cfg(target_os = "windows")]
    const CREATE_NO_WINDOW: u32 = 0x08000000;
    #[cfg(target_os = "windows")]
    cmd.creation_flags(CREATE_NO_WINDOW);

    let output = cmd.output().map_err(|e| e.to_string())?;
        
    if !output.status.success() {
        return Err(String::from_utf8_lossy(&output.stderr).to_string());
    }
    Ok(())
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
            rename_item,
            search_in_files,
            run_command,
            execute_shell_command,
            git_status,
            git_add,
            git_commit
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
