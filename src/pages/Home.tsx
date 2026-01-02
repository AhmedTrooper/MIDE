import { useEditorStore } from "../lib/store";
import { Button } from "../components/ui/button";
import { FolderOpen, Clock, X, Code2 } from "lucide-react";
export const Home = () => {
  const {
    recentProjects,
    openProjectByPath,
    openProjectDialog,
    removeRecentProject,
  } = useEditorStore();
  return (
    <div className="h-full flex flex-col items-center justify-center bg-[#1e1e1e] text-white p-8 overflow-auto">
      <div className="max-w-4xl w-full space-y-12">
        <div className="text-center space-y-4">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-blue-600/20 rounded-2xl">
              <Code2 className="w-16 h-16 text-blue-500" />
            </div>
          </div>
          <h1 className="text-5xl font-bold tracking-tight bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            MIDE
          </h1>
          <p className="text-xl text-gray-400">
            The Professional IDE for Modern Development
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold flex items-center gap-3 text-blue-400">
              <FolderOpen className="w-6 h-6" /> Start
            </h2>
            <div className="space-y-3">
              <Button
                variant="secondary"
                className="w-full justify-start h-14 text-lg bg-[#2a2a2a] hover:bg-[#333] border border-[#333] transition-all hover:border-blue-500/50"
                onClick={openProjectDialog}
              >
                <FolderOpen className="mr-3 w-5 h-5" />
                Open Project...
              </Button>
            </div>
          </div>
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold flex items-center gap-3 text-purple-400">
              <Clock className="w-6 h-6" /> Recent Projects
            </h2>
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {recentProjects.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed border-[#333] rounded-lg text-gray-500">
                  No recent projects found
                </div>
              ) : (
                recentProjects.map((path) => (
                  <div
                    key={path}
                    className="group flex items-center gap-2 bg-[#252526] rounded-lg p-1 border border-transparent hover:border-[#444] transition-all"
                  >
                    <Button
                      variant="ghost"
                      className="flex-1 justify-start h-auto py-3 px-4 text-left font-normal hover:bg-[#2a2a2a] rounded-md"
                      onClick={() => openProjectByPath(path)}
                    >
                      <div className="truncate w-full">
                        <div className="font-medium text-base text-gray-200 group-hover:text-blue-400 transition-colors">
                          {path.split(/[/\\]/).pop()}
                        </div>
                        <div className="text-xs text-gray-500 truncate mt-1 font-mono opacity-70">
                          {path}
                        </div>
                      </div>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="opacity-0 group-hover:opacity-100 h-8 w-8 text-gray-500 hover:text-red-400 hover:bg-red-400/10 mr-2 transition-all"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeRecentProject(path);
                      }}
                      title="Remove from recent"
                    >
                      <X size={16} />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};