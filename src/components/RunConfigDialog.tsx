import { useState, useEffect } from "react";
import { X, Plus, Trash, Save } from "lucide-react";
import { useEditorStore, type RunConfiguration } from "../lib/store";
import { Button } from "./ui/button";

export default function RunConfigDialog() {
  const {
    isRunConfigDialogOpen,
    setRunConfigDialogOpen,
    runConfigurations,
    setRunConfigurations,
    activeRunConfigId,
    setActiveRunConfigId,
  } = useEditorStore();

  const [localConfigs, setLocalConfigs] = useState<RunConfiguration[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (isRunConfigDialogOpen) {
      setLocalConfigs(JSON.parse(JSON.stringify(runConfigurations)));
      setSelectedId(activeRunConfigId);
    }
  }, [isRunConfigDialogOpen, runConfigurations, activeRunConfigId]);

  if (!isRunConfigDialogOpen) return null;

  const selectedConfig = localConfigs.find((c) => c.id === selectedId);

  const handleSave = () => {
    setRunConfigurations(localConfigs);
    if (selectedId) setActiveRunConfigId(selectedId);
    setRunConfigDialogOpen(false);
  };

  const handleAdd = () => {
    const newConfig: RunConfiguration = {
      id: crypto.randomUUID(),
      name: "New Configuration",
      command: "",
      args: [],
      cwd: "${workspaceFolder}",
    };
    setLocalConfigs([...localConfigs, newConfig]);
    setSelectedId(newConfig.id);
  };

  const handleDelete = (id: string) => {
    const newConfigs = localConfigs.filter((c) => c.id !== id);
    setLocalConfigs(newConfigs);
    if (selectedId === id) {
      setSelectedId(newConfigs[0]?.id || null);
    }
  };

  const updateConfig = (id: string, updates: Partial<RunConfiguration>) => {
    setLocalConfigs(
      localConfigs.map((c) => (c.id === id ? { ...c, ...updates } : c))
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-[800px] h-[500px] bg-[#252526] rounded-lg shadow-2xl border border-[#454545] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#333]">
          <h2 className="text-sm font-medium text-white">
            Run/Debug Configurations
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setRunConfigDialogOpen(false)}
            className="h-6 w-6 text-gray-400 hover:text-white hover:bg-transparent"
          >
            <X size={18} />
          </Button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar List */}
          <div className="w-64 border-r border-[#333] flex flex-col bg-[#1e1e1e]">
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {localConfigs.map((config) => (
                <div
                  key={config.id}
                  onClick={() => setSelectedId(config.id)}
                  className={`px-3 py-2 rounded cursor-pointer text-sm flex items-center justify-between group ${
                    selectedId === config.id
                      ? "bg-[#094771] text-white"
                      : "text-gray-400 hover:bg-[#2a2d2e]"
                  }`}
                >
                  <span className="truncate">{config.name}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(config.id);
                    }}
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 hover:text-red-400 hover:bg-transparent"
                  >
                    <Trash size={14} />
                  </Button>
                </div>
              ))}
            </div>
            <div className="p-2 border-t border-[#333]">
              <Button
                variant="ghost"
                onClick={handleAdd}
                className="w-full justify-start gap-2 text-xs text-blue-400 hover:text-blue-300 px-2 py-1 h-8"
              >
                <Plus size={14} /> Add New Configuration
              </Button>
            </div>
          </div>

          {/* Config Form */}
          <div className="flex-1 p-6 overflow-y-auto bg-[#252526]">
            {selectedConfig ? (
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs text-gray-400">Name</label>
                  <input
                    type="text"
                    value={selectedConfig.name}
                    onChange={(e) =>
                      updateConfig(selectedConfig.id, { name: e.target.value })
                    }
                    className="w-full bg-[#3c3c3c] border border-[#333] rounded px-3 py-1.5 text-sm text-white focus:border-[#007fd4] outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-gray-400">
                    Command / Executable
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={selectedConfig.command}
                      onChange={(e) =>
                        updateConfig(selectedConfig.id, {
                          command: e.target.value,
                        })
                      }
                      placeholder="e.g. npm, python, cargo"
                      className="flex-1 bg-[#3c3c3c] border border-[#333] rounded px-3 py-1.5 text-sm text-white focus:border-[#007fd4] outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-gray-400">Arguments</label>
                  <input
                    type="text"
                    value={selectedConfig.args?.join(" ") || ""}
                    onChange={(e) =>
                      updateConfig(selectedConfig.id, {
                        args: e.target.value.split(" "),
                      })
                    }
                    placeholder="e.g. run dev, main.py"
                    className="w-full bg-[#3c3c3c] border border-[#333] rounded px-3 py-1.5 text-sm text-white focus:border-[#007fd4] outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-gray-400">
                    Working Directory
                  </label>
                  <input
                    type="text"
                    value={selectedConfig.cwd || ""}
                    onChange={(e) =>
                      updateConfig(selectedConfig.id, { cwd: e.target.value })
                    }
                    placeholder="${workspaceFolder}"
                    className="w-full bg-[#3c3c3c] border border-[#333] rounded px-3 py-1.5 text-sm text-white focus:border-[#007fd4] outline-none"
                  />
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500 text-sm">
                Select a configuration to edit
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-[#333] flex justify-end gap-2 bg-[#1e1e1e]">
          <Button
            variant="secondary"
            onClick={() => setRunConfigDialogOpen(false)}
            className="h-8 text-xs bg-[#3c3c3c] hover:bg-[#4c4c4c] text-white border-none"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            className="h-8 text-xs bg-[#007fd4] hover:bg-[#006bb3] text-white border-none gap-2"
          >
            <Save size={14} /> Apply & Close
          </Button>
        </div>
      </div>
    </div>
  );
}
