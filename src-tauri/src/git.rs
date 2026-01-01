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

// Tags
#[tauri::command]
pub fn git_tags(cwd: String) -> Result<Vec<String>, String> {
    let stdout = execute_git_command(&["tag", "-l"], &cwd)?;
    Ok(stdout.lines().map(|s| s.to_string()).collect())
}

#[tauri::command]
pub fn git_create_tag(cwd: String, name: String, message: Option<String>) -> Result<(), String> {
    if let Some(msg) = message {
        execute_git_command(&["tag", "-a", &name, "-m", &msg], &cwd)?;
    } else {
        execute_git_command(&["tag", &name], &cwd)?;
    }
    Ok(())
}

#[tauri::command]
pub fn git_delete_tag(cwd: String, name: String) -> Result<(), String> {
    execute_git_command(&["tag", "-d", &name], &cwd)?;
    Ok(())
}

#[tauri::command]
pub fn git_push_tag(cwd: String, name: String) -> Result<(), String> {
    execute_git_command(&["push", "origin", &name], &cwd)?;
    Ok(())
}

// Reset & Revert
#[tauri::command]
pub fn git_reset(cwd: String, commit: String, mode: String) -> Result<String, String> {
    let flag = match mode.as_str() {
        "soft" => "--soft",
        "mixed" => "--mixed",
        "hard" => "--hard",
        _ => "--mixed",
    };
    execute_git_command(&["reset", flag, &commit], &cwd)
}

#[tauri::command]
pub fn git_revert(cwd: String, commit: String) -> Result<String, String> {
    execute_git_command(&["revert", &commit, "--no-edit"], &cwd)
}

// Rebase
#[tauri::command]
pub fn git_rebase(cwd: String, branch: String) -> Result<String, String> {
    execute_git_command(&["rebase", &branch], &cwd)
}

#[tauri::command]
pub fn git_rebase_abort(cwd: String) -> Result<String, String> {
    execute_git_command(&["rebase", "--abort"], &cwd)
}

#[tauri::command]
pub fn git_rebase_continue(cwd: String) -> Result<String, String> {
    execute_git_command(&["rebase", "--continue"], &cwd)
}

// Cherry-pick
#[tauri::command]
pub fn git_cherry_pick(cwd: String, commit: String) -> Result<String, String> {
    execute_git_command(&["cherry-pick", &commit], &cwd)
}

// Blame
#[tauri::command]
pub fn git_blame(cwd: String, file: String) -> Result<String, String> {
    execute_git_command(&["blame", &file], &cwd)
}

// Show commit
#[tauri::command]
pub fn git_show(cwd: String, commit: String) -> Result<String, String> {
    execute_git_command(&["show", &commit], &cwd)
}

// File history
#[tauri::command]
pub fn git_file_history(cwd: String, file: String, limit: usize) -> Result<Vec<GitCommit>, String> {
    let limit_str = limit.to_string();
    let stdout = execute_git_command(
        &[
            "log",
            &format!("-{}", limit_str),
            "--pretty=format:%H%x00%an%x00%ae%x00%at%x00%s%x00%b%x00",
            "-z",
            "--",
            &file,
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

// Compare branches
#[tauri::command]
pub fn git_compare_branches(cwd: String, base: String, compare: String) -> Result<String, String> {
    execute_git_command(&["diff", &format!("{}...{}", base, compare)], &cwd)
}

// Reflog
#[tauri::command]
pub fn git_reflog(cwd: String, limit: usize) -> Result<Vec<String>, String> {
    let limit_str = limit.to_string();
    let stdout = execute_git_command(&["reflog", "-n", &limit_str], &cwd)?;
    Ok(stdout.lines().map(|s| s.to_string()).collect())
}

// Clean
#[tauri::command]
pub fn git_clean(cwd: String, force: bool, directories: bool) -> Result<String, String> {
    let mut args = vec!["clean"];
    if force {
        args.push("-f");
    }
    if directories {
        args.push("-d");
    }
    execute_git_command(&args, &cwd)
}

// Conflicts
#[tauri::command]
pub fn git_list_conflicts(cwd: String) -> Result<Vec<GitFile>, String> {
    let stdout = execute_git_command(&["diff", "--name-only", "--diff-filter=U"], &cwd)?;
    let files: Vec<GitFile> = stdout
        .lines()
        .map(|path| GitFile {
            status: "UU".to_string(),
            path: path.to_string(),
        })
        .collect();
    Ok(files)
}

#[tauri::command]
pub fn git_resolve_conflict(cwd: String, file: String, strategy: String) -> Result<(), String> {
    match strategy.as_str() {
        "ours" => execute_git_command(&["checkout", "--ours", &file], &cwd)?,
        "theirs" => execute_git_command(&["checkout", "--theirs", &file], &cwd)?,
        _ => return Err("Invalid strategy".to_string()),
    };
    execute_git_command(&["add", &file], &cwd)?;
    Ok(())
}

// Config
#[tauri::command]
pub fn git_config_get(cwd: String, key: String) -> Result<String, String> {
    execute_git_command(&["config", "--get", &key], &cwd)
}

#[tauri::command]
pub fn git_config_set(cwd: String, key: String, value: String) -> Result<(), String> {
    execute_git_command(&["config", &key, &value], &cwd)?;
    Ok(())
}

#[tauri::command]
pub fn git_config_list(cwd: String) -> Result<Vec<String>, String> {
    let stdout = execute_git_command(&["config", "--list"], &cwd)?;
    Ok(stdout.lines().map(|s| s.to_string()).collect())
}

// Current branch
#[tauri::command]
pub fn git_current_branch(cwd: String) -> Result<String, String> {
    let stdout = execute_git_command(&["branch", "--show-current"], &cwd)?;
    Ok(stdout.trim().to_string())
}

// Stash operations
#[tauri::command]
pub fn git_stash_apply(cwd: String, index: Option<usize>) -> Result<String, String> {
    if let Some(idx) = index {
        execute_git_command(&["stash", "apply", &format!("stash@{{{}}}", idx)], &cwd)
    } else {
        execute_git_command(&["stash", "apply"], &cwd)
    }
}

#[tauri::command]
pub fn git_stash_drop(cwd: String, index: usize) -> Result<String, String> {
    execute_git_command(&["stash", "drop", &format!("stash@{{{}}}", index)], &cwd)
}

#[tauri::command]
pub fn git_stash_clear(cwd: String) -> Result<String, String> {
    execute_git_command(&["stash", "clear"], &cwd)
}

// Search commits
#[tauri::command]
pub fn git_search_commits(
    cwd: String,
    query: String,
    search_type: String,
    limit: usize,
) -> Result<Vec<GitCommit>, String> {
    let limit_str = limit.to_string();
    let search_arg = match search_type.as_str() {
        "message" => format!("--grep={}", query),
        "author" => format!("--author={}", query),
        "committer" => format!("--committer={}", query),
        _ => format!("--grep={}", query),
    };

    let stdout = execute_git_command(
        &[
            "log",
            &search_arg,
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
