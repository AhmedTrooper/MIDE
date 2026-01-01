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
pub fn ensure_plugin_dir(plugin_dir: String) -> Result<(), String> {
    let path = PathBuf::from(plugin_dir);
    if !path.exists() {
        fs::create_dir_all(&path)
            .map_err(|e| format!("Failed to create plugin directory: {}", e))?;
    }
    Ok(())
}

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

#[tauri::command]
pub fn install_plugin(
    plugin_dir: String,
    plugin_url: String,
    plugin_id: String,
) -> Result<(), String> {
    let plugin_path = PathBuf::from(&plugin_dir).join(&plugin_id);

    // Create plugin directory
    fs::create_dir_all(&plugin_path)
        .map_err(|e| format!("Failed to create plugin directory: {}", e))?;

    // Create demo plugin based on plugin_id
    let (manifest_content, index_content) = match plugin_id.as_str() {
        "prettier-format" => (
            r#"{
  "id": "prettier-format",
  "name": "Prettier Formatter",
  "version": "1.0.0",
  "description": "Format your code with Prettier",
  "author": "MIDE Team",
  "type": "js",
  "main": "index.js",
  "activation_events": ["onCommand:prettier.format"],
  "contributes": {
    "commands": [
      {
        "id": "prettier.format",
        "title": "Format Document",
        "category": "Prettier"
      }
    ]
  },
  "permissions": ["fs:read", "fs:write"],
  "enabled": true
}"#,
            r#"// Prettier Formatter Plugin
self.addEventListener('message', (e) => {
  const { type, data } = e.data;
  if (type === 'activate') {
    console.log('Prettier formatter activated!');
  }
});
"#,
        ),
        "bracket-pair-colorizer" => (
            r#"{
  "id": "bracket-pair-colorizer",
  "name": "Bracket Pair Colorizer",
  "version": "1.0.0",
  "description": "Colorize matching brackets",
  "author": "MIDE Team",
  "type": "js",
  "main": "index.js",
  "activation_events": ["*"],
  "contributes": {},
  "permissions": ["editor:read"],
  "enabled": true
}"#,
            r#"// Bracket Pair Colorizer Plugin
self.addEventListener('message', (e) => {
  console.log('Bracket colorizer active');
});
"#,
        ),
        "auto-save" => (
            r#"{
  "id": "auto-save",
  "name": "Auto Save",
  "version": "1.0.0",
  "description": "Automatically save files after delay",
  "author": "MIDE Team",
  "type": "js",
  "main": "index.js",
  "activation_events": ["*"],
  "contributes": {},
  "permissions": ["fs:write"],
  "enabled": true
}"#,
            r#"// Auto Save Plugin
let saveTimeout;
self.addEventListener('message', (e) => {
  const { type, data } = e.data;
  if (type === 'fileChange') {
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
      console.log('Auto-saving file...');
    }, 1000);
  }
});
"#,
        ),
        "git-lens" => (
            r#"{
  "id": "git-lens",
  "name": "Git Lens",
  "version": "1.0.0",
  "description": "Enhanced Git integration",
  "author": "MIDE Team",
  "type": "js",
  "main": "index.js",
  "activation_events": ["onView:git"],
  "contributes": {},
  "permissions": ["git:read"],
  "enabled": true
}"#,
            r#"// Git Lens Plugin
self.addEventListener('message', (e) => {
  console.log('Git Lens activated');
});
"#,
        ),
        _ => return Err(format!("Unknown plugin: {}", plugin_id)),
    };

    // Write plugin.json
    let manifest_path = plugin_path.join("plugin.json");
    fs::write(&manifest_path, manifest_content)
        .map_err(|e| format!("Failed to write manifest: {}", e))?;

    // Write index.js
    let index_path = plugin_path.join("index.js");
    fs::write(&index_path, index_content)
        .map_err(|e| format!("Failed to write plugin code: {}", e))?;

    Ok(())
}

#[tauri::command]
pub fn uninstall_plugin(plugin_dir: String, plugin_id: String) -> Result<(), String> {
    let plugin_path = Path::new(&plugin_dir).join(&plugin_id);

    if !plugin_path.exists() {
        return Err(format!("Plugin {} not found", plugin_id));
    }

    fs::remove_dir_all(&plugin_path)
        .map_err(|e| format!("Failed to remove plugin directory: {}", e))?;

    Ok(())
}
