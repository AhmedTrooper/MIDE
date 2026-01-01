use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;
use walkdir::WalkDir;

#[derive(Serialize, Deserialize, Debug)]
pub struct TodoItem {
    file: String,
    line: usize,
    #[serde(rename = "type")]
    todo_type: String,
    text: String,
}

fn extract_todos_from_file(path: &Path) -> Vec<TodoItem> {
    let mut todos = Vec::new();

    let content = match fs::read_to_string(path) {
        Ok(c) => c,
        Err(_) => return todos,
    };

    let patterns = [
        ("TODO", &["TODO:", "TODO", "@todo"]),
        ("FIXME", &["FIXME:", "FIXME", "@fixme"]),
        ("HACK", &["HACK:", "HACK", "@hack"]),
        ("BUG", &["BUG:", "BUG", "@bug"]),
        ("NOTE", &["NOTE:", "NOTE", "@note"]),
    ];

    for (line_num, line) in content.lines().enumerate() {
        let line_lower = line.to_lowercase();

        for (todo_type, keywords) in &patterns {
            for keyword in *keywords {
                if line_lower.contains(&keyword.to_lowercase()) {
                    // Extract the text after the keyword
                    let keyword_pos = line_lower.find(&keyword.to_lowercase()).unwrap();
                    let after_keyword = &line[keyword_pos + keyword.len()..];
                    let text = after_keyword.trim().to_string();

                    if !text.is_empty() {
                        todos.push(TodoItem {
                            file: path.to_string_lossy().to_string(),
                            line: line_num + 1,
                            todo_type: todo_type.to_string(),
                            text,
                        });
                        break; // Only match first pattern per line
                    }
                }
            }
        }
    }

    todos
}

#[tauri::command]
pub fn search_todos(path: String) -> Result<String, String> {
    let mut all_todos = Vec::new();
    let root_path = Path::new(&path);

    for entry in WalkDir::new(root_path)
        .follow_links(false)
        .into_iter()
        .filter_entry(|e| {
            let name = e.file_name().to_string_lossy();
            // Skip common directories
            !name.starts_with('.')
                && name != "node_modules"
                && name != "target"
                && name != "dist"
                && name != "build"
                && name != "__pycache__"
        })
    {
        let entry = match entry {
            Ok(e) => e,
            Err(_) => continue,
        };

        if !entry.file_type().is_file() {
            continue;
        }

        let entry_path = entry.path();

        // Only process text-based files
        if let Some(ext) = entry_path.extension() {
            let ext_str = ext.to_string_lossy().to_lowercase();
            let valid_extensions = [
                "rs", "js", "ts", "jsx", "tsx", "py", "go", "java", "c", "cpp", "h", "hpp", "cs",
                "php", "rb", "swift", "kt", "scala", "vue", "svelte", "css", "scss", "sass",
                "less", "html", "xml", "yaml", "yml", "toml", "json", "md", "txt", "sh", "bash",
                "zsh", "fish", "lua", "vim", "sql",
            ];

            if valid_extensions.contains(&ext_str.as_str()) {
                let file_todos = extract_todos_from_file(entry_path);
                all_todos.extend(file_todos);
            }
        }
    }

    // Sort by type priority: FIXME/BUG > TODO > HACK > NOTE
    all_todos.sort_by(|a, b| {
        let priority = |t: &str| match t {
            "FIXME" | "BUG" => 0,
            "TODO" => 1,
            "HACK" => 2,
            "NOTE" => 3,
            _ => 4,
        };
        priority(&a.todo_type).cmp(&priority(&b.todo_type))
    });

    serde_json::to_string(&all_todos).map_err(|e| e.to_string())
}
