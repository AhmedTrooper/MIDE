use portable_pty::{CommandBuilder, NativePtySystem, PtySize, PtySystem};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::io::{Read, Write};
use std::path::Path;
use std::process::Command;
use std::sync::{Arc, Mutex};
use std::thread;
use tauri::{Emitter, Window};
struct PtySession {
    master: Arc<Mutex<Box<dyn portable_pty::MasterPty + Send>>>,
    writer: Arc<Mutex<Box<dyn Write + Send>>>,
}
lazy_static::lazy_static! {
    static ref TERMINAL_SESSIONS: Mutex<HashMap<String, PtySession>> = Mutex::new(HashMap::new());
}
#[derive(Debug, Serialize, Deserialize)]
pub struct VirtualEnv {
    path: String,
    #[serde(rename = "type")]
    env_type: String,
}
#[tauri::command]
pub fn spawn_pty(
    window: Window,
    id: String,
    rows: u16,
    cols: u16,
    cwd: Option<String>,
) -> Result<(), String> {
    let pty_system = NativePtySystem::default();
    let size = PtySize {
        rows,
        cols,
        pixel_width: 0,
        pixel_height: 0,
    };
    let pair = pty_system.openpty(size).map_err(|e| e.to_string())?;
    let mut cmd_builder = CommandBuilder::new(if cfg!(target_os = "windows") {
        "powershell"
    } else {
        "bash"
    });
    if let Some(dir) = cwd {
        cmd_builder.cwd(dir);
    }
    cmd_builder.env("TERM", "xterm-256color");
    cmd_builder.env("COLORTERM", "truecolor");
    let mut child = pair.slave.spawn_command(cmd_builder).map_err(|e| e.to_string())?;
    let mut reader = pair.master.try_clone_reader().map_err(|e| e.to_string())?;
    let writer = pair.master.take_writer().map_err(|e| e.to_string())?;
    let master: Box<dyn portable_pty::MasterPty + Send> = pair.master;
    let master = Arc::new(Mutex::new(master));
    let writer = Arc::new(Mutex::new(writer));
    {
        let mut sessions = TERMINAL_SESSIONS.lock().unwrap();
        sessions.insert(
            id.clone(),
            PtySession {
                master: master.clone(),
                writer: writer.clone(),
            },
        );
    }
    let window_clone = window.clone();
    let id_clone = id.clone();
    thread::spawn(move || {
        let mut buffer = [0u8; 1024];
        loop {
            match reader.read(&mut buffer) {
                Ok(n) if n > 0 => {
                    let data = String::from_utf8_lossy(&buffer[..n]).to_string();
                    let _ = window_clone.emit(&format!("term-data-{}", id_clone), data);
                }
                Ok(_) => break,
                Err(_) => break,
            }
        }
        let _ = window_clone.emit(&format!("term-exit-{}", id_clone), 0);
        if let Ok(mut sessions) = TERMINAL_SESSIONS.lock() {
            sessions.remove(&id_clone);
        }
        let _ = child.wait();
    });
    Ok(())
}
#[tauri::command]
pub fn write_pty(id: String, data: String) -> Result<(), String> {
    let sessions = TERMINAL_SESSIONS.lock().unwrap();
    if let Some(session) = sessions.get(&id) {
        if let Ok(mut writer) = session.writer.lock() {
            write!(writer, "{}", data).map_err(|e| e.to_string())?;
        }
    }
    Ok(())
}
#[tauri::command]
pub fn resize_pty(id: String, rows: u16, cols: u16) -> Result<(), String> {
    let sessions = TERMINAL_SESSIONS.lock().unwrap();
    if let Some(session) = sessions.get(&id) {
        if let Ok(master) = session.master.lock() {
            master.resize(PtySize {
                rows,
                cols,
                pixel_width: 0,
                pixel_height: 0,
            }).map_err(|e| e.to_string())?;
        }
    }
    Ok(())
}
#[tauri::command]
pub fn detect_virtual_environments(project_path: String) -> Result<Vec<VirtualEnv>, String> {
    let mut venvs = Vec::new();
    let project = Path::new(&project_path);
    let venv_dirs = vec!["venv", ".venv", "env", ".env", "virtualenv"];
    for dir_name in venv_dirs {
        let venv_path = project.join(dir_name);
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
    Ok(venvs)
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