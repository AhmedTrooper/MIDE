use crate::models::GitFile;
#[cfg(target_os = "windows")]
use std::os::windows::process::CommandExt;
use std::process::Command;

#[tauri::command]
pub fn get_git_status(cwd: String) -> Result<Vec<GitFile>, String> {
    println!("Backend: get_git_status called with cwd: '{}'", cwd);
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
        if line.len() < 4 {
            continue;
        }
        let status = line[0..2].trim().to_string();
        let path = line[3..].to_string();
        files.push(GitFile { status, path });
    }

    Ok(files)
}

#[tauri::command]
pub fn git_add(cwd: String, files: Vec<String>) -> Result<(), String> {
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
pub fn git_commit(cwd: String, message: String) -> Result<(), String> {
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
