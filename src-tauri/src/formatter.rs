use std::process::Command;

#[tauri::command]
pub fn format_code(code: String, language: String) -> Result<String, String> {
    match language.as_str() {
        "javascript" | "typescript" | "json" | "html" | "css" => {
            format_with_prettier(&code, &language)
        }
        "rust" => format_with_rustfmt(&code),
        "python" => format_with_black(&code),
        "go" => format_with_gofmt(&code),
        _ => Ok(code), // Return unchanged if no formatter available
    }
}

#[tauri::command]
pub fn format_file(path: String) -> Result<String, String> {
    let ext = path.split('.').last().unwrap_or("");
    
    match ext {
        "js" | "jsx" | "ts" | "tsx" | "json" | "html" | "css" | "scss" | "vue" | "svelte" => {
            format_file_with_prettier(&path)
        }
        "rs" => format_file_with_rustfmt(&path),
        "py" => format_file_with_black(&path),
        "go" => format_file_with_gofmt(&path),
        _ => Err(format!("No formatter available for .{}", ext)),
    }
}

fn format_with_prettier(code: &str, language: &str) -> Result<String, String> {
    let parser = match language {
        "javascript" => "babel",
        "typescript" => "typescript",
        "json" => "json",
        "html" => "html",
        "css" => "css",
        _ => "babel",
    };

    let output = Command::new("npx")
        .args(&[
            "prettier",
            "--parser",
            parser,
            "--stdin-filepath",
            &format!("file.{}", get_ext_for_parser(parser)),
        ])
        .arg("--")
        .stdin(std::process::Stdio::piped())
        .stdout(std::process::Stdio::piped())
        .stderr(std::process::Stdio::piped())
        .spawn()
        .and_then(|mut child| {
            use std::io::Write;
            if let Some(mut stdin) = child.stdin.take() {
                stdin.write_all(code.as_bytes())?;
            }
            child.wait_with_output()
        })
        .map_err(|e| format!("Prettier not found: {}. Install with: npm install -g prettier", e))?;

    if output.status.success() {
        Ok(String::from_utf8_lossy(&output.stdout).to_string())
    } else {
        Err(String::from_utf8_lossy(&output.stderr).to_string())
    }
}

fn format_file_with_prettier(path: &str) -> Result<String, String> {
    let output = Command::new("npx")
        .args(&["prettier", "--write", path])
        .output()
        .map_err(|e| format!("Prettier not found: {}", e))?;

    if output.status.success() {
        Ok("File formatted successfully".to_string())
    } else {
        Err(String::from_utf8_lossy(&output.stderr).to_string())
    }
}

fn format_with_rustfmt(code: &str) -> Result<String, String> {
    let output = Command::new("rustfmt")
        .arg("--emit")
        .arg("stdout")
        .stdin(std::process::Stdio::piped())
        .stdout(std::process::Stdio::piped())
        .stderr(std::process::Stdio::piped())
        .spawn()
        .and_then(|mut child| {
            use std::io::Write;
            if let Some(mut stdin) = child.stdin.take() {
                stdin.write_all(code.as_bytes())?;
            }
            child.wait_with_output()
        })
        .map_err(|e| format!("rustfmt not found: {}. Install with: rustup component add rustfmt", e))?;

    if output.status.success() {
        Ok(String::from_utf8_lossy(&output.stdout).to_string())
    } else {
        Err(String::from_utf8_lossy(&output.stderr).to_string())
    }
}

fn format_file_with_rustfmt(path: &str) -> Result<String, String> {
    let output = Command::new("rustfmt")
        .arg(path)
        .output()
        .map_err(|e| format!("rustfmt not found: {}", e))?;

    if output.status.success() {
        Ok("File formatted successfully".to_string())
    } else {
        Err(String::from_utf8_lossy(&output.stderr).to_string())
    }
}

fn format_with_black(code: &str) -> Result<String, String> {
    let output = Command::new("black")
        .args(&["-", "--quiet"])
        .stdin(std::process::Stdio::piped())
        .stdout(std::process::Stdio::piped())
        .stderr(std::process::Stdio::piped())
        .spawn()
        .and_then(|mut child| {
            use std::io::Write;
            if let Some(mut stdin) = child.stdin.take() {
                stdin.write_all(code.as_bytes())?;
            }
            child.wait_with_output()
        })
        .map_err(|e| format!("black not found: {}. Install with: pip install black", e))?;

    if output.status.success() {
        Ok(String::from_utf8_lossy(&output.stdout).to_string())
    } else {
        Err(String::from_utf8_lossy(&output.stderr).to_string())
    }
}

fn format_file_with_black(path: &str) -> Result<String, String> {
    let output = Command::new("black")
        .arg(path)
        .output()
        .map_err(|e| format!("black not found: {}", e))?;

    if output.status.success() {
        Ok("File formatted successfully".to_string())
    } else {
        Err(String::from_utf8_lossy(&output.stderr).to_string())
    }
}

fn format_with_gofmt(code: &str) -> Result<String, String> {
    let output = Command::new("gofmt")
        .stdin(std::process::Stdio::piped())
        .stdout(std::process::Stdio::piped())
        .stderr(std::process::Stdio::piped())
        .spawn()
        .and_then(|mut child| {
            use std::io::Write;
            if let Some(mut stdin) = child.stdin.take() {
                stdin.write_all(code.as_bytes())?;
            }
            child.wait_with_output()
        })
        .map_err(|e| format!("gofmt not found: {}", e))?;

    if output.status.success() {
        Ok(String::from_utf8_lossy(&output.stdout).to_string())
    } else {
        Err(String::from_utf8_lossy(&output.stderr).to_string())
    }
}

fn format_file_with_gofmt(path: &str) -> Result<String, String> {
    let output = Command::new("gofmt")
        .args(&["-w", path])
        .output()
        .map_err(|e| format!("gofmt not found: {}", e))?;

    if output.status.success() {
        Ok("File formatted successfully".to_string())
    } else {
        Err(String::from_utf8_lossy(&output.stderr).to_string())
    }
}

fn get_ext_for_parser(parser: &str) -> &str {
    match parser {
        "babel" => "js",
        "typescript" => "ts",
        "json" => "json",
        "html" => "html",
        "css" => "css",
        _ => "txt",
    }
}
