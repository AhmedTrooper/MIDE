import { useSettingsStore } from "../lib/settingsStore";
import { Check, ChevronDown } from "lucide-react";
import { Input } from "./ui/input";
import { Checkbox } from "./ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

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
                <Input
                  type="number"
                  value={settings.fontSize}
                  onChange={(e) =>
                    handleChange("fontSize", parseInt(e.target.value))
                  }
                  className="bg-[#3c3c3c] border-[#555] text-white h-8 w-24"
                />
                <p className="text-xs text-gray-500">
                  Controls the font size in pixels.
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">Font Family</label>
                <Input
                  type="text"
                  value={settings.fontFamily}
                  onChange={(e) => handleChange("fontFamily", e.target.value)}
                  className="bg-[#3c3c3c] border-[#555] text-white placeholder:text-gray-500 h-8 w-full max-w-md"
                />
              </div>

              <div className="flex items-center justify-between max-w-md">
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium">Word Wrap</label>
                  <p className="text-xs text-gray-500">
                    Controls how lines should wrap.
                  </p>
                </div>
                <Select
                  value={settings.wordWrap}
                  onValueChange={(value) => handleChange("wordWrap", value)}
                >
                  <SelectTrigger className="w-[120px] bg-[#3c3c3c] border-[#555] text-white h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#2d2d30] border-[#454545] text-white">
                    <SelectItem
                      value="off"
                      className="hover:bg-[#3e3e42] focus:bg-[#3e3e42] cursor-pointer"
                    >
                      Off
                    </SelectItem>
                    <SelectItem
                      value="on"
                      className="hover:bg-[#3e3e42] focus:bg-[#3e3e42] cursor-pointer"
                    >
                      On
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-3">
                <Checkbox
                  id="minimap"
                  checked={settings.minimap}
                  onCheckedChange={(checked) =>
                    handleChange("minimap", checked)
                  }
                  className="w-4 h-4 border-gray-600 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                />
                <label
                  htmlFor="minimap"
                  className="text-sm font-medium select-none cursor-pointer"
                >
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
                  <p className="text-xs text-gray-500">
                    Specifies the color theme.
                  </p>
                </div>
                <Select
                  value={settings.theme}
                  onValueChange={(value) => handleChange("theme", value)}
                >
                  <SelectTrigger className="w-[200px] bg-[#3c3c3c] border-[#555] text-white h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#2d2d30] border-[#454545] text-white">
                    <SelectItem
                      value="vs-dark"
                      className="hover:bg-[#3e3e42] focus:bg-[#3e3e42] cursor-pointer"
                    >
                      Dark (Visual Studio)
                    </SelectItem>
                    <SelectItem
                      value="light"
                      className="hover:bg-[#3e3e42] focus:bg-[#3e3e42] cursor-pointer"
                    >
                      Light (Visual Studio)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
