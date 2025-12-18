use std::io::{BufRead, BufReader};
#[cfg(target_os = "windows")]
use std::os::windows::process::CommandExt;
use std::process::{Command, Stdio};
use std::thread;
use tauri::{Emitter, Window};

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
