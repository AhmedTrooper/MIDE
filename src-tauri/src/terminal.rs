use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::io::{BufRead, BufReader};
#[cfg(target_os = "windows")]
use std::os::windows::process::CommandExt;
use std::path::{Path, PathBuf};
use std::process::{Child, Command, Stdio};
use std::sync::Mutex;
use std::thread;
use tauri::{Emitter, Window};

// Global map to track running processes by terminal ID
lazy_static::lazy_static! {
    static ref TERMINAL_PROCESSES: Mutex<HashMap<String, u32>> = Mutex::new(HashMap::new());
}

#[derive(Debug, Serialize, Deserialize)]
pub struct VirtualEnv {
    path: String,
    #[serde(rename = "type")]
    env_type: String,
}

#[tauri::command]
pub fn detect_virtual_environments(project_path: String) -> Result<Vec<VirtualEnv>, String> {
    let mut venvs = Vec::new();
    let project = Path::new(&project_path);

    // Check for common Python virtual environment locations
    let venv_dirs = vec!["venv", ".venv", "env", ".env", "virtualenv"];

    for dir_name in venv_dirs {
        let venv_path = project.join(dir_name);

        // Check if Python executable exists in the expected location
        let python_paths = if cfg!(target_os = "windows") {
            vec![
                venv_path.join("Scripts").join("python.exe"),
                venv_path.join("Scripts").join("python3.exe"),
            ]
        } else {
            vec![
                venv_path.join("bin").join("python"),
                venv_path.join("bin").join("python3"),
            ]
        };

        for python_path in python_paths {
            if python_path.exists() {
                venvs.push(VirtualEnv {
                    path: venv_path.to_string_lossy().to_string(),
                    env_type: "venv".to_string(),
                });
                break;
            }
        }
    }

    // Check for Conda environments
    if let Ok(home) = std::env::var("HOME") {
        let conda_envs = Path::new(&home).join(".conda").join("envs");
        if conda_envs.exists() {
            if let Ok(entries) = std::fs::read_dir(&conda_envs) {
                for entry in entries.flatten() {
                    if entry.path().is_dir() {
                        venvs.push(VirtualEnv {
                            path: entry.path().to_string_lossy().to_string(),
                            env_type: "conda".to_string(),
                        });
                    }
                }
            }
        }
    }

    // Check for pipenv
    let pipfile = project.join("Pipfile");
    if pipfile.exists() {
        // Try to get pipenv venv location
        match Command::new("pipenv")
            .args(&["--venv"])
            .current_dir(project)
            .output()
        {
            Ok(output) if output.status.success() => {
                let venv_path = String::from_utf8_lossy(&output.stdout).trim().to_string();
                if !venv_path.is_empty() && Path::new(&venv_path).exists() {
                    venvs.push(VirtualEnv {
                        path: venv_path,
                        env_type: "virtualenv".to_string(),
                    });
                }
            }
            _ => {}
        }
    }

    // Check for Poetry
    let poetry_toml = project.join("pyproject.toml");
    if poetry_toml.exists() {
        match Command::new("poetry")
            .args(&["env", "info", "--path"])
            .current_dir(project)
            .output()
        {
            Ok(output) if output.status.success() => {
                let venv_path = String::from_utf8_lossy(&output.stdout).trim().to_string();
                if !venv_path.is_empty() && Path::new(&venv_path).exists() {
                    venvs.push(VirtualEnv {
                        path: venv_path,
                        env_type: "virtualenv".to_string(),
                    });
                }
            }
            _ => {}
        }
    }

    Ok(venvs)
}

#[tauri::command]
pub fn run_command(
    window: Window,
    id: String,
    command: String,
    args: Vec<String>,
    cwd: Option<String>,
) {
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
                // Store the process ID
                if let Some(pid) = child.id().into() {
                    if let Ok(mut processes) = TERMINAL_PROCESSES.lock() {
                        processes.insert(id.clone(), pid);
                    }
                }

                let stdout = child.stdout.take().unwrap();
                let stderr = child.stderr.take().unwrap();

                let window_clone_out = window.clone();
                let id_clone_out = id.clone();
                thread::spawn(move || {
                    let reader = BufReader::new(stdout);
                    for line in reader.lines() {
                        if let Ok(l) = line {
                            let _ =
                                window_clone_out.emit(&format!("term-data-{}", id_clone_out), l);
                        }
                    }
                });

                let window_clone_err = window.clone();
                let id_clone_err = id.clone();
                thread::spawn(move || {
                    let reader = BufReader::new(stderr);
                    for line in reader.lines() {
                        if let Ok(l) = line {
                            let _ =
                                window_clone_err.emit(&format!("term-data-{}", id_clone_err), l);
                        }
                    }
                });

                let status = child.wait();

                // Remove from tracking
                if let Ok(mut processes) = TERMINAL_PROCESSES.lock() {
                    processes.remove(&id);
                }

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
pub fn kill_terminal_process(id: String) -> Result<(), String> {
    if let Ok(mut processes) = TERMINAL_PROCESSES.lock() {
        if let Some(pid) = processes.remove(&id) {
            #[cfg(target_os = "windows")]
            {
                let _ = Command::new("taskkill")
                    .args(&["/F", "/T", "/PID", &pid.to_string()])
                    .output();
            }

            #[cfg(not(target_os = "windows"))]
            {
                // Kill process group on Unix-like systems
                let _ = Command::new("kill")
                    .args(&["-9", &format!("-{}", pid)])
                    .output();
            }
        }
    }
    Ok(())
}

#[tauri::command]
pub async fn execute_shell_command(
    command: String,
    args: Vec<String>,
    cwd: Option<String>,
) -> Result<String, String> {
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
