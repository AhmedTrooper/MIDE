use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::path::{Path, PathBuf};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PluginManifest {
    pub id: String,
    pub name: String,
    pub version: String,
    pub description: Option<String>,
    pub author: Option<String>,
    #[serde(rename = "type")]
    pub plugin_type: PluginType,
    pub main: String,
    pub activation_events: Vec<String>,
    pub contributes: Option<Contributions>,
    pub permissions: Vec<String>,
    pub enabled: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum PluginType {
    Js,
    Rust,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Contributions {
    pub commands: Option<Vec<Command>>,
    pub languages: Option<Vec<Language>>,
    pub themes: Option<Vec<Theme>>,
    pub views: Option<Vec<View>>,
    pub keybindings: Option<Vec<Keybinding>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Command {
    pub id: String,
    pub title: String,
    pub category: Option<String>,
    pub icon: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Language {
    pub id: String,
    pub extensions: Vec<String>,
    pub aliases: Option<Vec<String>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Theme {
    pub id: String,
    pub label: String,
    pub path: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct View {
    pub id: String,
    pub name: String,
    pub icon: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Keybinding {
    pub command: String,
    pub key: String,
    pub when: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
pub struct LoadedPlugin {
    pub manifest: PluginManifest,
    pub path: PathBuf,
    pub content: Option<String>, // JS content for JS plugins
}

pub struct PluginManager {
    plugins: HashMap<String, LoadedPlugin>,
    plugin_dir: PathBuf,
}

impl PluginManager {
    pub fn new(plugin_dir: PathBuf) -> Self {
        Self {
            plugins: HashMap::new(),
            plugin_dir,
        }
    }

    pub fn discover_plugins(&mut self) -> Result<Vec<PluginManifest>, String> {
        let mut discovered = Vec::new();

        if !self.plugin_dir.exists() {
            fs::create_dir_all(&self.plugin_dir).map_err(|e| e.to_string())?;
        }

        let entries = fs::read_dir(&self.plugin_dir).map_err(|e| e.to_string())?;

        for entry in entries.flatten() {
            let path = entry.path();
            if path.is_dir() {
                let manifest_path = path.join("plugin.json");
                if manifest_path.exists() {
                    match self.load_manifest(&manifest_path) {
                        Ok(manifest) => {
                            discovered.push(manifest);
                        }
                        Err(e) => {
                            eprintln!("Failed to load manifest from {:?}: {}", manifest_path, e);
                        }
                    }
                }
            }
        }

        Ok(discovered)
    }

    fn load_manifest(&self, path: &Path) -> Result<PluginManifest, String> {
        let content = fs::read_to_string(path).map_err(|e| e.to_string())?;
        serde_json::from_str(&content).map_err(|e| e.to_string())
    }

    pub fn load_plugin(&mut self, plugin_id: &str) -> Result<LoadedPlugin, String> {
        let plugin_path = self.plugin_dir.join(plugin_id);
        let manifest_path = plugin_path.join("plugin.json");

        if !manifest_path.exists() {
            return Err(format!("Plugin {} not found", plugin_id));
        }

        let manifest = self.load_manifest(&manifest_path)?;

        // For JS plugins, load the content
        let content = if matches!(manifest.plugin_type, PluginType::Js) {
            let main_path = plugin_path.join(&manifest.main);
            Some(fs::read_to_string(main_path).map_err(|e| e.to_string())?)
        } else {
            None
        };

        let loaded = LoadedPlugin {
            manifest: manifest.clone(),
            path: plugin_path,
            content,
        };

        self.plugins.insert(plugin_id.to_string(), loaded.clone());
        Ok(loaded)
    }

    #[allow(dead_code)]
    pub fn unload_plugin(&mut self, plugin_id: &str) -> Result<(), String> {
        self.plugins
            .remove(plugin_id)
            .ok_or_else(|| format!("Plugin {} not loaded", plugin_id))?;
        Ok(())
    }

    #[allow(dead_code)]
    pub fn get_loaded_plugins(&self) -> Vec<&LoadedPlugin> {
        self.plugins.values().collect()
    }

    #[allow(dead_code)]
    pub fn get_plugin(&self, plugin_id: &str) -> Option<&LoadedPlugin> {
        self.plugins.get(plugin_id)
    }
}

// Tauri Commands
#[tauri::command]
pub fn discover_plugins(plugin_dir: String) -> Result<Vec<PluginManifest>, String> {
    let mut manager = PluginManager::new(PathBuf::from(plugin_dir));
    manager.discover_plugins()
}

#[tauri::command]
pub fn load_plugin(plugin_dir: String, plugin_id: String) -> Result<LoadedPlugin, String> {
    let mut manager = PluginManager::new(PathBuf::from(plugin_dir));
    manager.load_plugin(&plugin_id)
}

#[tauri::command]
pub fn get_plugin_content(plugin_dir: String, plugin_id: String) -> Result<String, String> {
    let manager = PluginManager::new(PathBuf::from(plugin_dir));
    let plugin_path = manager.plugin_dir.join(plugin_id);
    let manifest_path = plugin_path.join("plugin.json");

    let manifest: PluginManifest = {
        let content = fs::read_to_string(&manifest_path).map_err(|e| e.to_string())?;
        serde_json::from_str(&content).map_err(|e| e.to_string())?
    };

    let main_path = plugin_path.join(&manifest.main);
    fs::read_to_string(main_path).map_err(|e| e.to_string())
}
