use std::process::Command;

// Helper function to execute gh commands
fn execute_gh_command(cwd: &str, args: &[&str]) -> Result<String, String> {
    let output = Command::new("gh")
        .args(args)
        .current_dir(cwd)
        .output()
        .map_err(|e| format!("Failed to execute gh command: {}", e))?;

    if output.status.success() {
        Ok(String::from_utf8_lossy(&output.stdout).to_string())
    } else {
        Err(String::from_utf8_lossy(&output.stderr).to_string())
    }
}

// Auth commands
#[tauri::command]
pub fn gh_auth_status(cwd: String) -> Result<String, String> {
    execute_gh_command(&cwd, &["auth", "status"])
}

#[tauri::command]
pub fn gh_auth_login(cwd: String) -> Result<String, String> {
    execute_gh_command(&cwd, &["auth", "login", "--web"])
}

#[tauri::command]
pub fn gh_auth_logout(cwd: String, hostname: String) -> Result<String, String> {
    execute_gh_command(&cwd, &["auth", "logout", "--hostname", &hostname])
}

// Repository commands
#[tauri::command]
pub fn gh_repo_view(cwd: String) -> Result<String, String> {
    execute_gh_command(&cwd, &["repo", "view", "--json", "name,description,url,owner,createdAt,pushedAt,stargazerCount,forkCount,isPrivate,defaultBranchRef"])
}

#[tauri::command]
pub fn gh_repo_create(
    cwd: String,
    name: String,
    description: String,
    public: bool,
) -> Result<String, String> {
    let visibility = if public { "public" } else { "private" };
    execute_gh_command(
        &cwd,
        &[
            "repo",
            "create",
            &name,
            "--description",
            &description,
            &format!("--{}", visibility),
        ],
    )
}

#[tauri::command]
pub fn gh_repo_fork(cwd: String, repo: String) -> Result<String, String> {
    execute_gh_command(&cwd, &["repo", "fork", &repo, "--clone"])
}

#[tauri::command]
pub fn gh_repo_clone(cwd: String, repo: String) -> Result<String, String> {
    execute_gh_command(&cwd, &["repo", "clone", &repo])
}

#[tauri::command]
pub fn gh_repo_sync(cwd: String) -> Result<String, String> {
    execute_gh_command(&cwd, &["repo", "sync"])
}

// Pull Request commands
#[tauri::command]
pub fn gh_pr_list(cwd: String, state: String) -> Result<String, String> {
    execute_gh_command(
        &cwd,
        &[
            "pr",
            "list",
            "--state",
            &state,
            "--json",
            "number,title,author,state,createdAt,updatedAt,url",
        ],
    )
}

#[tauri::command]
pub fn gh_pr_view(cwd: String, number: String) -> Result<String, String> {
    execute_gh_command(&cwd, &["pr", "view", &number, "--json", "number,title,body,author,state,createdAt,updatedAt,mergeable,additions,deletions,changedFiles,url,comments"])
}

#[tauri::command]
pub fn gh_pr_create(
    cwd: String,
    title: String,
    body: String,
    base: String,
) -> Result<String, String> {
    execute_gh_command(
        &cwd,
        &[
            "pr", "create", "--title", &title, "--body", &body, "--base", &base,
        ],
    )
}

#[tauri::command]
pub fn gh_pr_checkout(cwd: String, number: String) -> Result<String, String> {
    execute_gh_command(&cwd, &["pr", "checkout", &number])
}

#[tauri::command]
pub fn gh_pr_merge(cwd: String, number: String, method: String) -> Result<String, String> {
    execute_gh_command(&cwd, &["pr", "merge", &number, &format!("--{}", method)])
}

#[tauri::command]
pub fn gh_pr_close(cwd: String, number: String) -> Result<String, String> {
    execute_gh_command(&cwd, &["pr", "close", &number])
}

#[tauri::command]
pub fn gh_pr_reopen(cwd: String, number: String) -> Result<String, String> {
    execute_gh_command(&cwd, &["pr", "reopen", &number])
}

#[tauri::command]
pub fn gh_pr_review(
    cwd: String,
    number: String,
    action: String,
    body: String,
) -> Result<String, String> {
    execute_gh_command(
        &cwd,
        &[
            "pr",
            "review",
            &number,
            &format!("--{}", action),
            "--body",
            &body,
        ],
    )
}

#[tauri::command]
pub fn gh_pr_diff(cwd: String, number: String) -> Result<String, String> {
    execute_gh_command(&cwd, &["pr", "diff", &number])
}

#[tauri::command]
pub fn gh_pr_checks(cwd: String, number: String) -> Result<String, String> {
    execute_gh_command(&cwd, &["pr", "checks", &number])
}

// Issue commands
#[tauri::command]
pub fn gh_issue_list(cwd: String, state: String) -> Result<String, String> {
    execute_gh_command(
        &cwd,
        &[
            "issue",
            "list",
            "--state",
            &state,
            "--json",
            "number,title,author,state,createdAt,updatedAt,url,labels",
        ],
    )
}

#[tauri::command]
pub fn gh_issue_view(cwd: String, number: String) -> Result<String, String> {
    execute_gh_command(
        &cwd,
        &[
            "issue",
            "view",
            &number,
            "--json",
            "number,title,body,author,state,createdAt,updatedAt,url,labels,comments",
        ],
    )
}

#[tauri::command]
pub fn gh_issue_create(cwd: String, title: String, body: String) -> Result<String, String> {
    execute_gh_command(
        &cwd,
        &["issue", "create", "--title", &title, "--body", &body],
    )
}

#[tauri::command]
pub fn gh_issue_close(cwd: String, number: String) -> Result<String, String> {
    execute_gh_command(&cwd, &["issue", "close", &number])
}

#[tauri::command]
pub fn gh_issue_reopen(cwd: String, number: String) -> Result<String, String> {
    execute_gh_command(&cwd, &["issue", "reopen", &number])
}

#[tauri::command]
pub fn gh_issue_comment(cwd: String, number: String, body: String) -> Result<String, String> {
    execute_gh_command(&cwd, &["issue", "comment", &number, "--body", &body])
}

// Release commands
#[tauri::command]
pub fn gh_release_list(cwd: String) -> Result<String, String> {
    execute_gh_command(
        &cwd,
        &[
            "release",
            "list",
            "--json",
            "tagName,name,createdAt,publishedAt,url,isPrerelease,isDraft",
        ],
    )
}

#[tauri::command]
pub fn gh_release_view(cwd: String, tag: String) -> Result<String, String> {
    execute_gh_command(
        &cwd,
        &[
            "release",
            "view",
            &tag,
            "--json",
            "tagName,name,body,createdAt,publishedAt,url,assets",
        ],
    )
}

#[tauri::command]
pub fn gh_release_create(
    cwd: String,
    tag: String,
    title: String,
    notes: String,
) -> Result<String, String> {
    execute_gh_command(
        &cwd,
        &[
            "release", "create", &tag, "--title", &title, "--notes", &notes,
        ],
    )
}

#[tauri::command]
pub fn gh_release_delete(cwd: String, tag: String) -> Result<String, String> {
    execute_gh_command(&cwd, &["release", "delete", &tag, "--yes"])
}

#[tauri::command]
pub fn gh_release_download(cwd: String, tag: String) -> Result<String, String> {
    execute_gh_command(&cwd, &["release", "download", &tag])
}

// Workflow (Actions) commands
#[tauri::command]
pub fn gh_workflow_list(cwd: String) -> Result<String, String> {
    execute_gh_command(&cwd, &["workflow", "list", "--json", "id,name,state,path"])
}

#[tauri::command]
pub fn gh_workflow_view(cwd: String, workflow: String) -> Result<String, String> {
    execute_gh_command(&cwd, &["workflow", "view", &workflow])
}

#[tauri::command]
pub fn gh_workflow_run(cwd: String, workflow: String, branch: String) -> Result<String, String> {
    execute_gh_command(&cwd, &["workflow", "run", &workflow, "--ref", &branch])
}

#[tauri::command]
pub fn gh_workflow_enable(cwd: String, workflow: String) -> Result<String, String> {
    execute_gh_command(&cwd, &["workflow", "enable", &workflow])
}

#[tauri::command]
pub fn gh_workflow_disable(cwd: String, workflow: String) -> Result<String, String> {
    execute_gh_command(&cwd, &["workflow", "disable", &workflow])
}

#[tauri::command]
pub fn gh_run_list(cwd: String) -> Result<String, String> {
    execute_gh_command(
        &cwd,
        &[
            "run",
            "list",
            "--json",
            "databaseId,event,status,conclusion,createdAt,updatedAt,url,headBranch,workflowName",
        ],
    )
}

#[tauri::command]
pub fn gh_run_view(cwd: String, run_id: String) -> Result<String, String> {
    execute_gh_command(&cwd, &["run", "view", &run_id])
}

#[tauri::command]
pub fn gh_run_watch(cwd: String, run_id: String) -> Result<String, String> {
    execute_gh_command(&cwd, &["run", "watch", &run_id])
}

#[tauri::command]
pub fn gh_run_rerun(cwd: String, run_id: String) -> Result<String, String> {
    execute_gh_command(&cwd, &["run", "rerun", &run_id])
}

#[tauri::command]
pub fn gh_run_cancel(cwd: String, run_id: String) -> Result<String, String> {
    execute_gh_command(&cwd, &["run", "cancel", &run_id])
}

// Gist commands
#[tauri::command]
pub fn gh_gist_list(cwd: String) -> Result<String, String> {
    execute_gh_command(
        &cwd,
        &[
            "gist",
            "list",
            "--json",
            "id,description,public,files,createdAt,updatedAt",
        ],
    )
}

#[tauri::command]
pub fn gh_gist_view(cwd: String, gist_id: String) -> Result<String, String> {
    execute_gh_command(&cwd, &["gist", "view", &gist_id])
}

#[tauri::command]
pub fn gh_gist_create(
    cwd: String,
    files: Vec<String>,
    description: String,
    public: bool,
) -> Result<String, String> {
    let mut args = vec!["gist", "create"];
    for file in &files {
        args.push(file);
    }
    args.push("--desc");
    args.push(&description);
    if public {
        args.push("--public");
    }
    execute_gh_command(&cwd, &args)
}

#[tauri::command]
pub fn gh_gist_delete(cwd: String, gist_id: String) -> Result<String, String> {
    execute_gh_command(&cwd, &["gist", "delete", &gist_id])
}

// Browse commands
#[tauri::command]
pub fn gh_browse(cwd: String) -> Result<String, String> {
    execute_gh_command(&cwd, &["browse"])
}

#[tauri::command]
pub fn gh_browse_pr(cwd: String, number: String) -> Result<String, String> {
    execute_gh_command(&cwd, &["pr", "view", &number, "--web"])
}

#[tauri::command]
pub fn gh_browse_issue(cwd: String, number: String) -> Result<String, String> {
    execute_gh_command(&cwd, &["issue", "view", &number, "--web"])
}

// Status/Info commands
#[tauri::command]
pub fn gh_status(cwd: String) -> Result<String, String> {
    execute_gh_command(&cwd, &["status"])
}

#[tauri::command]
pub fn gh_api(cwd: String, endpoint: String) -> Result<String, String> {
    execute_gh_command(&cwd, &["api", &endpoint])
}
