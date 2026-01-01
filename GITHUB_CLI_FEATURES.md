# GitHub CLI Integration

## Overview

MIDE now includes comprehensive GitHub CLI (`gh`) integration, allowing you to work with GitHub repositories directly from the IDE.

## Switching Between Git and GitHub CLI

Click the **branch icon toggle** in the Source Control header to switch between:

- **Git Mode**: Traditional git operations (commit, push, pull, branches)
- **GitHub Mode**: GitHub-specific features (pull requests, issues, actions, releases)

## Authentication

Before using GitHub CLI features, you need to authenticate:

1. Click the branch icon to enable GitHub mode
2. If not authenticated, you'll see a "Login to GitHub" button
3. Click it to authenticate via web browser
4. Return to MIDE and GitHub features will be available

## GitHub CLI Features

### Pull Requests Tab

View and manage pull requests for your repository:

**Available Operations:**

- `gh_pr_list` - List pull requests (open/closed/merged)
- `gh_pr_view` - View detailed PR information
- `gh_pr_create` - Create a new pull request
- `gh_pr_checkout` - Checkout a PR locally
- `gh_pr_merge` - Merge a pull request (merge/squash/rebase)
- `gh_pr_close` - Close a pull request
- `gh_pr_reopen` - Reopen a closed PR
- `gh_pr_review` - Review a PR (approve/comment/request-changes)
- `gh_pr_diff` - View PR diff
- `gh_pr_checks` - View CI/CD check status

**UI Features:**

- Create PR button at the top
- List of open PRs with title, author, and date
- Click to view details

### Issues Tab

Manage GitHub issues:

**Available Operations:**

- `gh_issue_list` - List issues (open/closed)
- `gh_issue_view` - View issue details
- `gh_issue_create` - Create a new issue
- `gh_issue_close` - Close an issue
- `gh_issue_reopen` - Reopen a closed issue
- `gh_issue_comment` - Add comment to issue

**UI Features:**

- Create Issue button at the top
- List of open issues with title, author, and date
- Click to view details

### Actions Tab

View GitHub Actions workflows and runs:

**Available Operations:**

- `gh_workflow_list` - List all workflows
- `gh_workflow_view` - View workflow details
- `gh_workflow_run` - Trigger a workflow run
- `gh_workflow_enable` - Enable a workflow
- `gh_workflow_disable` - Disable a workflow
- `gh_run_list` - List workflow runs
- `gh_run_view` - View run details
- `gh_run_watch` - Watch a running workflow
- `gh_run_rerun` - Re-run a workflow
- `gh_run_cancel` - Cancel a running workflow

**UI Features:**

- List of workflows with name and state
- Click to view run history

### Releases Tab

Manage GitHub releases:

**Available Operations:**

- `gh_release_list` - List all releases
- `gh_release_view` - View release details
- `gh_release_create` - Create a new release
- `gh_release_delete` - Delete a release
- `gh_release_download` - Download release assets

**UI Features:**

- List of releases with version tag and date
- Click to view assets and details

## Repository Operations

**Available via three-dot menu or commands:**

- `gh_repo_view` - View repository information (JSON)
- `gh_repo_create` - Create a new repository
- `gh_repo_fork` - Fork a repository
- `gh_repo_clone` - Clone a repository
- `gh_repo_sync` - Sync fork with upstream
- `gh_browse` - Open repository in browser
- `gh_browse_pr` - Open PR in browser
- `gh_browse_issue` - Open issue in browser

## Gist Operations

**Available commands:**

- `gh_gist_list` - List your gists
- `gh_gist_view` - View gist content
- `gh_gist_create` - Create a new gist
- `gh_gist_delete` - Delete a gist

## Authentication Commands

- `gh_auth_status` - Check authentication status
- `gh_auth_login` - Login to GitHub
- `gh_auth_logout` - Logout from GitHub

## Advanced Operations

- `gh_status` - View GitHub repository status
- `gh_api` - Make custom GitHub API calls

## Requirements

1. **GitHub CLI installed**: Install from https://cli.github.com/
2. **Authentication**: Run `gh auth login` or use the UI button
3. **Git repository**: Must be inside a GitHub repository

## Installation

### Linux/macOS:

```bash
# Using Homebrew
brew install gh

# Using APT (Ubuntu/Debian)
sudo apt install gh

# Using YUM (Fedora/CentOS)
sudo yum install gh
```

### Windows:

```bash
# Using Scoop
scoop install gh

# Using Chocolatey
choco install gh

# Using WinGet
winget install --id GitHub.cli
```

## Usage Examples

### Create a Pull Request

1. Switch to GitHub mode (click branch icon)
2. Navigate to "Pull Requests" tab
3. Click "Create Pull Request"
4. Enter title and description
5. PR is created and appears in the list

### View CI/CD Status

1. Go to "Actions" tab
2. See list of workflows
3. Click on a workflow to view runs
4. Monitor build/test status

### Create a Release

1. Go to "Releases" tab
2. Use `gh_release_create` command
3. Provide tag name, title, and release notes
4. Release is published

## Backend Implementation

All GitHub CLI operations are implemented in `src-tauri/src/gh.rs`:

- **50+ commands** covering all major GitHub operations
- **JSON output parsing** for structured data
- **Error handling** with meaningful messages
- **Authentication checks** before operations

## Comparison: Git vs GitHub CLI

| Feature       | Git Mode        | GitHub Mode     |
| ------------- | --------------- | --------------- |
| Commits       | ✅ Full support | ❌ Use Git mode |
| Branches      | ✅ Full support | ❌ Use Git mode |
| Push/Pull     | ✅ Full support | ❌ Use Git mode |
| Pull Requests | ❌ N/A          | ✅ Full support |
| Issues        | ❌ N/A          | ✅ Full support |
| CI/CD Actions | ❌ N/A          | ✅ Full support |
| Releases      | ❌ N/A          | ✅ Full support |
| Code Review   | ❌ N/A          | ✅ Full support |

## Tips

1. **Use both modes**: Switch between Git and GitHub modes as needed
2. **Keyboard shortcuts**: Use tab navigation for quick access
3. **Authentication**: Stay logged in for seamless operations
4. **API limits**: GitHub has rate limits; be mindful of excessive API calls
5. **Web fallback**: Use "Browse" options to open items in browser when needed

## Troubleshooting

### "gh not found"

- Install GitHub CLI from https://cli.github.com/
- Ensure `gh` is in your PATH

### "Not authenticated"

- Click "Login to GitHub" button
- Or run `gh auth login` in terminal

### "API rate limit exceeded"

- Wait for rate limit to reset (usually 1 hour)
- Authenticate to get higher rate limits

### Empty lists

- Ensure you're in a GitHub repository
- Check authentication status
- Verify repository has PRs/issues/actions

## Future Enhancements

Planned features:

- Inline PR review comments
- Workflow log viewer
- Release asset management
- Draft PR support
- Issue labels and milestones
- Project boards integration
