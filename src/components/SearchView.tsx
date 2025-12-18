import { useEditorStore } from "../lib/store";
import { Loader2, X } from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import { getLanguageFromPath } from "../lib/utils";

export default function SearchView() {
  const {
    searchResults,
    isSearching,
    searchQuery,
    performSearch,
    setSearchQuery,
    openFile,
  } = useEditorStore();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(searchQuery);
  };

  const clearSearch = () => {
    setSearchQuery("");
    // Optionally clear results too, but keeping them might be useful
  };

  const handleResultClick = async (result: any) => {
    try {
      const content = await invoke<string>("read_file_content", {
        path: result.file,
      });
      const name = result.file.split(/[/\\]/).pop() || result.file;
      openFile({
        path: result.file,
        name,
        content,
        language: getLanguageFromPath(result.file),
        isDirty: false,
      });
    } catch (err) {
      console.error("Error opening file:", err);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#252526] text-[#cccccc] w-64 border-r border-[#1e1e1e]">
      <div className="p-4">
        <div className="text-[11px] font-bold mb-2 uppercase tracking-wide">
          Search
        </div>
        <form onSubmit={handleSearch} className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search"
            className="w-full bg-[#3c3c3c] border border-[#3c3c3c] focus:border-[#007fd4] outline-none text-sm px-2 py-1 text-white placeholder-gray-400 pr-8"
          />
          {searchQuery && !isSearching && (
            <X
              className="absolute right-2 top-1.5 text-gray-400 hover:text-white cursor-pointer"
              size={14}
              onClick={clearSearch}
            />
          )}
          {isSearching && (
            <Loader2
              className="absolute right-2 top-1.5 animate-spin text-gray-400"
              size={14}
            />
          )}
        </form>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-[#424242] scrollbar-track-transparent">
        {searchResults.length > 0 && (
          <div className="px-4 pb-2 text-xs text-gray-400">
            {searchResults.length} results found
          </div>
        )}

        {searchResults.map((result, i) => (
          <div
            key={i}
            onClick={() => handleResultClick(result)}
            className="px-4 py-2 hover:bg-[#2a2d2e] cursor-pointer group border-b border-[#2a2d2e]"
          >
            <div className="flex justify-between items-center mb-0.5">
              <div
                className="text-xs text-blue-400 truncate font-medium"
                title={result.file}
              >
                {result.file.split(/[/\\]/).pop()}
              </div>
              <span className="text-[10px] text-gray-500">:{result.line}</span>
            </div>
            <div className="text-xs text-gray-300 truncate font-mono opacity-80">
              {result.content}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
