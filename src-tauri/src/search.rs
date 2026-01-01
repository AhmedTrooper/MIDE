use fuzzy_matcher::skim::SkimMatcherV2;
use fuzzy_matcher::FuzzyMatcher;
use serde::{Deserialize, Serialize};
use std::path::Path;
use walkdir::WalkDir;

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct FileResult {
    pub path: String,
    pub score: i64,
}

#[tauri::command]
pub fn fuzzy_search_files(path: String, query: String) -> Result<Vec<FileResult>, String> {
    let matcher = SkimMatcherV2::default();
    let mut results = Vec::new();
    let root_path = Path::new(&path);

    for entry in WalkDir::new(root_path)
        .follow_links(false)
        .into_iter()
        .filter_entry(|e| {
            let name = e.file_name().to_string_lossy();
            !name.starts_with('.') && name != "node_modules" && name != "target" && name != "dist"
        })
    {
        let entry = match entry {
            Ok(e) => e,
            Err(_) => continue,
        };

        if !entry.file_type().is_file() {
            continue;
        }

        let path_str = entry.path().to_string_lossy();
        // Calculate relative path for better matching
        let relative_path = path_str.replace(&path, "").replace('\\', "/");
        let clean_path = relative_path.trim_start_matches('/');

        if let Some(score) = matcher.fuzzy_match(clean_path, &query) {
            results.push(FileResult {
                path: path_str.to_string(),
                score,
            });
        }
    }

    // Sort by score descending
    results.sort_by(|a, b| b.score.cmp(&a.score));

    // Return top 50 results
    Ok(results.into_iter().take(50).collect())
}
