#[cfg(target_os = "windows")]
use std::os::windows::process::CommandExt;
use std::process::Command;
#[tauri::command]
pub fn adb_devices() -> Result<String, String> {
    let mut cmd = Command::new("adb");
    cmd.arg("devices");
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
#[tauri::command]
pub fn adb_connect(address: String) -> Result<String, String> {
    let mut cmd = Command::new("adb");
    cmd.args(&["connect", &address]);
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
#[tauri::command]
pub fn adb_disconnect(device: String) -> Result<String, String> {
    let mut cmd = Command::new("adb");
    cmd.args(&["disconnect", &device]);
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
#[tauri::command]
pub fn emulator_list_avds() -> Result<String, String> {
    let mut cmd = Command::new("emulator");
    cmd.args(&["-list-avds"]);
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
#[tauri::command]
pub fn emulator_start(avd_name: String) -> Result<String, String> {
    let mut cmd = Command::new("emulator");
    cmd.args(&["-avd", &avd_name]);
    #[cfg(target_os = "windows")]
    const CREATE_NO_WINDOW: u32 = 0x08000000;
    #[cfg(target_os = "windows")]
    cmd.creation_flags(CREATE_NO_WINDOW);
    cmd.spawn().map_err(|e| e.to_string())?;
    Ok(format!("Starting emulator: {}", avd_name))
}