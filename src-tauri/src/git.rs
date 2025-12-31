use crate::models::{GitBranch, GitCommit, GitDiff, GitFile, GitRemote, GitStatus};
#[cfg(target_os = "windows")]
use std::os::windows::process::CommandExt;
use std::process::Command;

// Helper function to execute git commands
fn execute_git_command(args: &[&str], cwd: &str) -> Result<String, String> {
    let mut cmd = Command::new("git");
    cmd.args(args);
    cmd.current_dir(cwd);

    #[cfg(target_os = "windows")]
    const CREATE_NO_WINDOW: u32 = 0x08000000;
    #[cfg(target_os = "windows")]
    cmd.creation_flags(CREATE_NO_WINDOW);

    let output = cmd.output().map_err(|e| e.to_string())?;

    if !output.status.success() {
        return Err(String::from_utf8_lossy(&output.stderr).to_string());
    }

    Ok(String::from_utf8_lossy(&output.stdout).to_string())
}

#[tauri::command]
pub fn git_status_check(cwd: String) -> Result<Vec<GitFile>, String> {
    let stdout = execute_git_command(&["status", "--porcelain=v1", "-z"], &cwd)?;
    let mut files = Vec::new();

    for entry in stdout.split('\0').filter(|s| !s.is_empty()) {
        if entry.len() < 4 {
            continue;
        }
        let status = entry[0..2].to_string();
        let path = entry[3..].to_string();
        files.push(GitFile { status, path });
    }

    Ok(files)
}

#[tauri::command]
pub fn git_status_full(cwd: String) -> Result<GitStatus, String> {
    let stdout = execute_git_command(&["status", "--porcelain=v1", "-b", "-z"], &cwd)?;

    let mut branch = String::new();
    let mut files = Vec::new();
    let mut ahead = 0;
    let mut behind = 0;

    for (i, entry) in stdout.split('\0').filter(|s| !s.is_empty()).enumerate() {
        if i == 0 && entry.starts_with("## ") {
            let branch_info = &entry[3..];
            if let Some(pos) = branch_info.find("...") {
                branch = branch_info[..pos].to_string();
                // Parse ahead/behind
                if let Some(ahead_pos) = branch_info.find("[ahead ") {
                    if let Some(num_str) = branch_info[ahead_pos + 7..].split(']').next() {
                        ahead = num_str.trim().parse().unwrap_or(0);
                    }
                }
                if let Some(behind_pos) = branch_info.find("behind ") {
                    if let Some(num_str) = branch_info[behind_pos + 7..].split(']').next() {
                        behind = num_str.trim().parse().unwrap_or(0);
                    }
                }
            } else {
                branch = branch_info.to_string();
            }
            continue;
        }

        if entry.len() >= 4 {
            let status = entry[0..2].to_string();
            let path = entry[3..].to_string();
            files.push(GitFile { status, path });
        }
    }

    Ok(GitStatus {
        branch,
        files,
        ahead,
        behind,
    })
}

#[tauri::command]
pub fn git_add(cwd: String, files: Vec<String>) -> Result<(), String> {
    let mut args = vec!["add"];
    let file_refs: Vec<&str> = files.iter().map(|s| s.as_str()).collect();
    args.extend_from_slice(&file_refs);
    execute_git_command(&args, &cwd)?;
    Ok(())
}

#[tauri::command]
pub fn git_unstage(cwd: String, files: Vec<String>) -> Result<(), String> {
    let mut args = vec!["restore", "--staged"];
    let file_refs: Vec<&str> = files.iter().map(|s| s.as_str()).collect();
    args.extend_from_slice(&file_refs);
    execute_git_command(&args, &cwd)?;
    Ok(())
}

#[tauri::command]
pub fn git_discard(cwd: String, files: Vec<String>) -> Result<(), String> {
    let mut args = vec!["restore"];
    let file_refs: Vec<&str> = files.iter().map(|s| s.as_str()).collect();
    args.extend_from_slice(&file_refs);
    execute_git_command(&args, &cwd)?;
    Ok(())
}

#[tauri::command]
pub fn git_commit(cwd: String, message: String) -> Result<String, String> {
    execute_git_command(&["commit", "-m", &message], &cwd)
}

#[tauri::command]
pub fn git_commit_amend(cwd: String, message: String) -> Result<String, String> {
    execute_git_command(&["commit", "--amend", "-m", &message], &cwd)
}

#[tauri::command]
pub fn git_diff(cwd: String, file: String, staged: bool) -> Result<GitDiff, String> {
    let args = if staged {
        vec!["diff", "--cached", "--", &file]
    } else {
        vec!["diff", "--", &file]
    };

    let diff = execute_git_command(&args, &cwd)?;

    Ok(GitDiff {
        file,
        content: diff,
        staged,
    })
}

#[tauri::command]
pub fn git_log(cwd: String, limit: usize) -> Result<Vec<GitCommit>, String> {
    let limit_str = limit.to_string();
    let stdout = execute_git_command(
        &[
            "log",
            &format!("-{}", limit_str),
            "--pretty=format:%H%x00%an%x00%ae%x00%at%x00%s%x00%b%x00",
            "-z",
        ],
        &cwd,
    )?;

    let mut commits = Vec::new();
    for entry in stdout.split("\0\0").filter(|s| !s.is_empty()) {
        let parts: Vec<&str> = entry.split('\0').collect();
        if parts.len() >= 5 {
            commits.push(GitCommit {
                hash: parts[0].to_string(),
                author: parts[1].to_string(),
                email: parts[2].to_string(),
                timestamp: parts[3].parse().unwrap_or(0),
                message: parts[4].to_string(),
                body: parts.get(5).unwrap_or(&"").to_string(),
            });
        }
    }

    Ok(commits)
}

#[tauri::command]
pub fn git_branches(cwd: String) -> Result<Vec<GitBranch>, String> {
    let stdout = execute_git_command(
        &[
            "branch",
            "-a",
            "-v",
            "--format=%(refname:short)%00%(HEAD)%00%(upstream:short)",
        ],
        &cwd,
    )?;

    let mut branches = Vec::new();
    for line in stdout.lines() {
        let parts: Vec<&str> = line.split('\0').collect();
        if parts.len() >= 2 {
            branches.push(GitBranch {
                name: parts[0].to_string(),
                current: parts[1] == "*",
                remote: parts.get(2).unwrap_or(&"").to_string(),
            });
        }
    }

    Ok(branches)
}

#[tauri::command]
pub fn git_create_branch(cwd: String, name: String) -> Result<(), String> {
    execute_git_command(&["branch", &name], &cwd)?;
    Ok(())
}

#[tauri::command]
pub fn git_checkout_branch(cwd: String, name: String) -> Result<(), String> {
    execute_git_command(&["checkout", &name], &cwd)?;
    Ok(())
}

#[tauri::command]
pub fn git_delete_branch(cwd: String, name: String, force: bool) -> Result<(), String> {
    let flag = if force { "-D" } else { "-d" };
    execute_git_command(&["branch", flag, &name], &cwd)?;
    Ok(())
}

#[tauri::command]
pub fn git_merge(cwd: String, branch: String) -> Result<String, String> {
    execute_git_command(&["merge", &branch], &cwd)
}

#[tauri::command]
pub fn git_pull(cwd: String) -> Result<String, String> {
    execute_git_command(&["pull"], &cwd)
}

#[tauri::command]
pub fn git_push(cwd: String, set_upstream: bool, branch: String) -> Result<String, String> {
    if set_upstream {
        execute_git_command(&["push", "-u", "origin", &branch], &cwd)
    } else {
        execute_git_command(&["push"], &cwd)
    }
}

#[tauri::command]
pub fn git_fetch(cwd: String) -> Result<String, String> {
    execute_git_command(&["fetch"], &cwd)
}

#[tauri::command]
pub fn git_remotes(cwd: String) -> Result<Vec<GitRemote>, String> {
    let stdout = execute_git_command(&["remote", "-v"], &cwd)?;

    let mut remotes = Vec::new();
    let mut seen = std::collections::HashSet::new();

    for line in stdout.lines() {
        let parts: Vec<&str> = line.split_whitespace().collect();
        if parts.len() >= 2 {
            let name = parts[0].to_string();
            if seen.insert(name.clone()) {
                remotes.push(GitRemote {
                    name,
                    url: parts[1].to_string(),
                });
            }
        }
    }

    Ok(remotes)
}

#[tauri::command]
pub fn git_add_remote(cwd: String, name: String, url: String) -> Result<(), String> {
    execute_git_command(&["remote", "add", &name, &url], &cwd)?;
    Ok(())
}

#[tauri::command]
pub fn git_remove_remote(cwd: String, name: String) -> Result<(), String> {
    execute_git_command(&["remote", "remove", &name], &cwd)?;
    Ok(())
}

#[tauri::command]
pub fn git_stash(cwd: String, message: Option<String>) -> Result<String, String> {
    if let Some(msg) = message {
        execute_git_command(&["stash", "push", "-m", &msg], &cwd)
    } else {
        execute_git_command(&["stash"], &cwd)
    }
}

#[tauri::command]
pub fn git_stash_pop(cwd: String) -> Result<String, String> {
    execute_git_command(&["stash", "pop"], &cwd)
}

#[tauri::command]
pub fn git_stash_list(cwd: String) -> Result<Vec<String>, String> {
    let stdout = execute_git_command(&["stash", "list"], &cwd)?;
    Ok(stdout.lines().map(|s| s.to_string()).collect())
}

#[tauri::command]
pub fn git_init(cwd: String) -> Result<(), String> {
    execute_git_command(&["init"], &cwd)?;
    Ok(())
}

#[tauri::command]
pub fn git_clone(url: String, target: String) -> Result<(), String> {
    execute_git_command(&["clone", &url, &target], ".")?;
    Ok(())
}
