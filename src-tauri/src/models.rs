use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct SearchResult {
    pub file: String,
    pub line: usize,
    pub content: String,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct FileNode {
    pub name: String,
    pub path: String,
    pub is_dir: bool,
    pub children: Option<Vec<FileNode>>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct GitFile {
    pub path: String,
    pub status: String,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct GitStatus {
    pub branch: String,
    pub files: Vec<GitFile>,
    pub ahead: i32,
    pub behind: i32,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct GitBranch {
    pub name: String,
    pub current: bool,
    pub remote: String,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct GitCommit {
    pub hash: String,
    pub author: String,
    pub email: String,
    pub timestamp: i64,
    pub message: String,
    pub body: String,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct GitDiff {
    pub file: String,
    pub content: String,
    pub staged: bool,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct GitRemote {
    pub name: String,
    pub url: String,
}
