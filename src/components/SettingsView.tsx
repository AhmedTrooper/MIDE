import { useSettingsStore } from "../lib/settingsStore";
import { Check, ChevronDown } from "lucide-react";

export default function SettingsView() {
  const { settings, updateSettings } = useSettingsStore();

  const handleChange = (key: keyof typeof settings, value: any) => {
    updateSettings({ [key]: value });
  };

  return (
    <div className="flex flex-col h-full bg-[#1e1e1e] text-[#cccccc] w-full overflow-hidden">
      <div className="px-8 py-6 max-w-4xl mx-auto w-full overflow-y-auto scrollbar-thin scrollbar-thumb-[#424242]">
        <h1 className="text-2xl font-medium mb-6 text-white">Settings</h1>

        <div className="space-y-8">
          {/* Editor Section */}
          <section>
            <h2 className="text-sm font-bold uppercase tracking-wider text-blue-400 mb-4">
              Text Editor
            </h2>
            
            <div className="space-y-4">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">Font Size</label>
                <input
                  type="number"
                  value={settings.fontSize}
                  onChange={(e) => handleChange("fontSize", parseInt(e.target.value))}
                  className="bg-[#3c3c3c] border border-[#3c3c3c] rounded px-3 py-1.5 text-sm w-24 focus:border-blue-500 outline-none"
                />
                <p className="text-xs text-gray-500">Controls the font size in pixels.</p>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">Font Family</label>
                <input
                  type="text"
                  value={settings.fontFamily}
                  onChange={(e) => handleChange("fontFamily", e.target.value)}
                  className="bg-[#3c3c3c] border border-[#3c3c3c] rounded px-3 py-1.5 text-sm w-full max-w-md focus:border-blue-500 outline-none"
                />
              </div>

              <div className="flex items-center justify-between max-w-md">
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium">Word Wrap</label>
                  <p className="text-xs text-gray-500">Controls how lines should wrap.</p>
                </div>
                <select
                  value={settings.wordWrap}
                  onChange={(e) => handleChange("wordWrap", e.target.value)}
                  className="bg-[#3c3c3c] border border-[#3c3c3c] rounded px-3 py-1.5 text-sm outline-none"
                >
                  <option value="off">Off</option>
                  <option value="on">On</option>
                </select>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="minimap"
                  checked={settings.minimap}
                  onChange={(e) => handleChange("minimap", e.target.checked)}
                  className="w-4 h-4 rounded border-gray-600 bg-[#3c3c3c] text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="minimap" className="text-sm font-medium select-none cursor-pointer">
                  Show Minimap
                </label>
              </div>
            </div>
          </section>

          {/* Window Section */}
          <section>
            <h2 className="text-sm font-bold uppercase tracking-wider text-blue-400 mb-4">
              Window
            </h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between max-w-md">
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium">Theme</label>
                  <p className="text-xs text-gray-500">Specifies the color theme.</p>
                </div>
                <select
                  value={settings.theme}
                  onChange={(e) => handleChange("theme", e.target.value)}
                  className="bg-[#3c3c3c] border border-[#3c3c3c] rounded px-3 py-1.5 text-sm outline-none"
                >
                  <option value="vs-dark">Dark (Visual Studio)</option>
                  <option value="light">Light (Visual Studio)</option>
                </select>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
