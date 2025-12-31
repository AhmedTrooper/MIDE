import { useEffect } from "react";
import { useEditorStore } from "./lib/store";
import EditorLayout from "./components/EditorLayout";
import TitleBar from "./components/TitleBar";

export default function App() {
  const { fileTree, openProjectDialog } = useEditorStore();

  // Optional: Load a default project for dev purposes or check local storage
  useEffect(() => {
    // You could load the last opened path here
  }, []);

  return (
    <div className="flex flex-col h-screen w-screen bg-[#1e1e1e] text-white overflow-hidden">
      <TitleBar />

      <div className="flex-1 overflow-hidden relative flex flex-col">
        {!fileTree ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-6">
            <div className="text-center">
              <h1 className="text-5xl font-bold mb-2 text-blue-500">
                VS Code Clone
              </h1>
              <p className="text-gray-400 text-lg">
                Premium Code Editing Experience
              </p>
            </div>

            <div className="flex flex-col gap-3 w-64">
              <button
                onClick={openProjectDialog}
                className="bg-blue-600 hover:bg-blue-500 text-white py-2.5 px-4 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2"
              >
                Open Folder
              </button>
              <button className="bg-[#2d2d2d] hover:bg-[#3d3d3d] text-gray-300 py-2.5 px-4 rounded-md text-sm font-medium transition-colors">
                Clone Repository
              </button>
            </div>

            <div className="text-xs text-gray-600 mt-8">
              Powered by Tauri v2 & React
            </div>
          </div>
        ) : (
          <EditorLayout />
        )}
      </div>
    </div>
  );
}
