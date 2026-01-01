import { useEffect, useState } from "react";
import { usePluginStore } from "../lib/pluginStore";
import type { PluginManifest } from "../lib/pluginStore";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";
import {
  Plug,
  Power,
  RefreshCw,
  Package,
  ShoppingCart,
  Star,
} from "lucide-react";
import { Badge } from "./ui/badge";

interface MarketplacePlugin {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  downloads: number;
  rating: number;
  category: string;
  tags: string[];
}

type ViewMode = "installed" | "marketplace";

export default function PluginManagerView() {
  const {
    availablePlugins,
    loadedPlugins,
    isLoading,
    initializePluginSystem,
    discoverPlugins,
    enablePlugin,
    disablePlugin,
  } = usePluginStore();

  const [selectedPlugin, setSelectedPlugin] = useState<PluginManifest | null>(
    null
  );
  const [viewMode, setViewMode] = useState<ViewMode>("installed");
  const [marketplacePlugins, setMarketplacePlugins] = useState<
    MarketplacePlugin[]
  >([]);
  const [selectedMarketplacePlugin, setSelectedMarketplacePlugin] =
    useState<MarketplacePlugin | null>(null);

  useEffect(() => {
    initializePluginSystem();
    loadMarketplacePlugins();
  }, []);

  const loadMarketplacePlugins = async () => {
    try {
      const response = await fetch("/plugins/marketplace.json");
      const data = await response.json();
      setMarketplacePlugins(data.plugins || []);
    } catch (error) {
      console.error("Failed to load marketplace:", error);
    }
  };

  const isPluginLoaded = (pluginId: string) => {
    return loadedPlugins.has(pluginId);
  };

  const isPluginInstalled = (pluginId: string) => {
    return availablePlugins.some((p) => p.id === pluginId);
  };

  const handleTogglePlugin = async (plugin: PluginManifest) => {
    if (isPluginLoaded(plugin.id)) {
      await disablePlugin(plugin.id);
    } else {
      await enablePlugin(plugin.id);
    }
  };

  return (
    <div className="flex h-full bg-[#1e1e1e]">
      {/* Plugin List */}
      <div className="w-80 border-r border-[#333] flex flex-col">
        <div className="p-4 border-b border-[#333]">
          {/* View Mode Tabs */}
          <div className="flex gap-2 mb-4">
            <Button
              variant={viewMode === "installed" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("installed")}
              className="flex-1"
            >
              <Package size={16} className="mr-2" />
              Installed
            </Button>
            <Button
              variant={viewMode === "marketplace" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("marketplace")}
              className="flex-1"
            >
              <ShoppingCart size={16} className="mr-2" />
              Marketplace
            </Button>
          </div>

          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Plug size={20} />
              {viewMode === "installed" ? "Installed" : "Marketplace"}
            </h2>
            {viewMode === "installed" && (
              <Button
                variant="ghost"
                size="icon"
                onClick={discoverPlugins}
                disabled={isLoading}
                className="h-8 w-8"
              >
                <RefreshCw
                  size={16}
                  className={isLoading ? "animate-spin" : ""}
                />
              </Button>
            )}
          </div>
          {viewMode === "installed" && (
            <div className="text-xs text-gray-400">
              {availablePlugins.length} extension
              {availablePlugins.length !== 1 ? "s" : ""} available
            </div>
          )}
          {viewMode === "marketplace" && (
            <div className="text-xs text-gray-400">
              {marketplacePlugins.length} extension
              {marketplacePlugins.length !== 1 ? "s" : ""} in marketplace
            </div>
          )}
        </div>

        <ScrollArea className="flex-1">
          {viewMode === "installed" && availablePlugins.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              <Package size={48} className="mx-auto mb-4 opacity-50" />
              <p className="text-sm">No extensions found</p>
              <p className="text-xs mt-2">
                Install extensions in ~/.mide/plugins
              </p>
            </div>
          )}

          {viewMode === "installed" && availablePlugins.length > 0 && (
            <div className="p-2">
              {availablePlugins.map((plugin) => (
                <div
                  key={plugin.id}
                  onClick={() => {
                    setSelectedPlugin(plugin);
                    setSelectedMarketplacePlugin(null);
                  }}
                  className={`p-3 mb-2 rounded cursor-pointer transition-colors ${
                    selectedPlugin?.id === plugin.id
                      ? "bg-[#37373d] border border-blue-500"
                      : "bg-[#252526] hover:bg-[#2a2d2e] border border-transparent"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-medium text-white truncate">
                          {plugin.name}
                        </h3>
                        {isPluginLoaded(plugin.id) && (
                          <Badge className="bg-green-500/20 text-green-400 text-xs">
                            Active
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 line-clamp-2">
                        {plugin.description || "No description"}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-gray-500">
                          v{plugin.version}
                        </span>
                        {plugin.author && (
                          <span className="text-xs text-gray-500">
                            • {plugin.author}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {viewMode === "marketplace" && (
            <div className="p-2">
              {marketplacePlugins.map((plugin) => (
                <div
                  key={plugin.id}
                  onClick={() => {
                    setSelectedMarketplacePlugin(plugin);
                    setSelectedPlugin(null);
                  }}
                  className={`p-3 mb-2 rounded cursor-pointer transition-colors ${
                    selectedMarketplacePlugin?.id === plugin.id
                      ? "bg-[#37373d] border border-blue-500"
                      : "bg-[#252526] hover:bg-[#2a2d2e] border border-transparent"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-medium text-white truncate">
                          {plugin.name}
                        </h3>
                        {isPluginInstalled(plugin.id) && (
                          <Badge className="bg-blue-500/20 text-blue-400 text-xs">
                            Installed
                          </Badge>
                        )}
                        <div className="flex items-center gap-1 text-xs text-yellow-400">
                          <Star size={12} fill="currentColor" />
                          <span>{plugin.rating.toFixed(1)}</span>
                        </div>
                      </div>
                      <p className="text-xs text-gray-400 line-clamp-2">
                        {plugin.description}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-gray-500">
                          {plugin.downloads.toLocaleString()} downloads
                        </span>
                        <span className="text-xs text-gray-500">
                          • {plugin.author}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Plugin Details */}
      <div className="flex-1 flex flex-col">
        {selectedPlugin ? (
          <>
            <div className="p-6 border-b border-[#333]">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-2xl font-bold text-white mb-2">
                    {selectedPlugin.name}
                  </h1>
                  <p className="text-sm text-gray-400">
                    {selectedPlugin.description || "No description provided"}
                  </p>
                </div>
                <Button
                  onClick={() => handleTogglePlugin(selectedPlugin)}
                  className={
                    isPluginLoaded(selectedPlugin.id)
                      ? "bg-red-600 hover:bg-red-700"
                      : "bg-blue-600 hover:bg-blue-700"
                  }
                >
                  <Power size={16} className="mr-2" />
                  {isPluginLoaded(selectedPlugin.id) ? "Disable" : "Enable"}
                </Button>
              </div>

              <div className="flex items-center gap-4 text-sm text-gray-400">
                <span>Version {selectedPlugin.version}</span>
                {selectedPlugin.author && (
                  <span>by {selectedPlugin.author}</span>
                )}
                <Badge
                  variant="outline"
                  className="text-xs border-gray-600 text-gray-400"
                >
                  {selectedPlugin.type === "js" ? "JavaScript" : "Rust"}
                </Badge>
              </div>
            </div>

            <ScrollArea className="flex-1 p-6">
              <div className="space-y-6">
                {/* Contributions */}
                {selectedPlugin.contributes && (
                  <div>
                    <h2 className="text-lg font-semibold text-white mb-4">
                      Contributions
                    </h2>

                    {selectedPlugin.contributes.commands &&
                      selectedPlugin.contributes.commands.length > 0 && (
                        <div className="mb-4">
                          <h3 className="text-sm font-medium text-gray-300 mb-2">
                            Commands (
                            {selectedPlugin.contributes.commands.length})
                          </h3>
                          <div className="space-y-1">
                            {selectedPlugin.contributes.commands.map((cmd) => (
                              <div
                                key={cmd.id}
                                className="text-sm text-gray-400 bg-[#252526] p-2 rounded"
                              >
                                <span className="text-white">{cmd.title}</span>
                                {cmd.category && (
                                  <span className="text-xs text-gray-500 ml-2">
                                    ({cmd.category})
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                    {selectedPlugin.contributes.languages &&
                      selectedPlugin.contributes.languages.length > 0 && (
                        <div className="mb-4">
                          <h3 className="text-sm font-medium text-gray-300 mb-2">
                            Languages (
                            {selectedPlugin.contributes.languages.length})
                          </h3>
                          <div className="flex flex-wrap gap-2">
                            {selectedPlugin.contributes.languages.map(
                              (lang) => (
                                <Badge
                                  key={lang.id}
                                  variant="outline"
                                  className="text-xs"
                                >
                                  {lang.id}
                                </Badge>
                              )
                            )}
                          </div>
                        </div>
                      )}

                    {selectedPlugin.contributes.keybindings &&
                      selectedPlugin.contributes.keybindings.length > 0 && (
                        <div className="mb-4">
                          <h3 className="text-sm font-medium text-gray-300 mb-2">
                            Keybindings (
                            {selectedPlugin.contributes.keybindings.length})
                          </h3>
                          <div className="space-y-1">
                            {selectedPlugin.contributes.keybindings.map(
                              (kb, idx) => (
                                <div
                                  key={idx}
                                  className="text-sm text-gray-400 bg-[#252526] p-2 rounded flex justify-between"
                                >
                                  <span>{kb.command}</span>
                                  <Badge className="bg-[#3c3c3c] text-white text-xs">
                                    {kb.key}
                                  </Badge>
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      )}
                  </div>
                )}

                {/* Permissions */}
                {selectedPlugin.permissions &&
                  selectedPlugin.permissions.length > 0 && (
                    <div>
                      <h2 className="text-lg font-semibold text-white mb-4">
                        Permissions
                      </h2>
                      <div className="space-y-1">
                        {selectedPlugin.permissions.map((perm, idx) => (
                          <div
                            key={idx}
                            className="text-sm text-gray-400 bg-[#252526] p-2 rounded"
                          >
                            {perm}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                {/* Activation Events */}
                {selectedPlugin.activation_events &&
                  selectedPlugin.activation_events.length > 0 && (
                    <div>
                      <h2 className="text-lg font-semibold text-white mb-4">
                        Activation Events
                      </h2>
                      <div className="space-y-1">
                        {selectedPlugin.activation_events.map((event, idx) => (
                          <div
                            key={idx}
                            className="text-sm text-gray-400 bg-[#252526] p-2 rounded font-mono"
                          >
                            {event}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
              </div>
            </ScrollArea>
          </>
        ) : selectedMarketplacePlugin ? (
          /* Marketplace Plugin Details */
          <>
            <div className="p-6 border-b border-[#333]">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-2xl font-bold text-white mb-2">
                    {selectedMarketplacePlugin.name}
                  </h1>
                  <p className="text-sm text-gray-400">
                    {selectedMarketplacePlugin.description}
                  </p>
                  <div className="flex items-center gap-4 mt-3">
                    <div className="flex items-center gap-1 text-yellow-400">
                      <Star size={16} fill="currentColor" />
                      <span className="text-sm font-medium">
                        {selectedMarketplacePlugin.rating.toFixed(1)}
                      </span>
                    </div>
                    <span className="text-sm text-gray-500">
                      {selectedMarketplacePlugin.downloads.toLocaleString()}{" "}
                      downloads
                    </span>
                  </div>
                </div>
                <Button
                  disabled={isPluginInstalled(selectedMarketplacePlugin.id)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isPluginInstalled(selectedMarketplacePlugin.id)
                    ? "Installed"
                    : "Install"}
                </Button>
              </div>

              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Version:</span>
                  <p className="text-white">
                    {selectedMarketplacePlugin.version}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500">Author:</span>
                  <p className="text-white">
                    {selectedMarketplacePlugin.author}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500">Category:</span>
                  <p className="text-white">
                    {selectedMarketplacePlugin.category}
                  </p>
                </div>
              </div>
            </div>

            <ScrollArea className="flex-1">
              <div className="p-6 space-y-6">
                {selectedMarketplacePlugin.tags &&
                  selectedMarketplacePlugin.tags.length > 0 && (
                    <div>
                      <h2 className="text-lg font-semibold text-white mb-3">
                        Tags
                      </h2>
                      <div className="flex flex-wrap gap-2">
                        {selectedMarketplacePlugin.tags.map((tag) => (
                          <Badge
                            key={tag}
                            variant="outline"
                            className="text-xs bg-[#252526]"
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                <div>
                  <h2 className="text-lg font-semibold text-white mb-3">
                    About
                  </h2>
                  <p className="text-sm text-gray-400">
                    This extension provides{" "}
                    {selectedMarketplacePlugin.description.toLowerCase()}. It
                    has been downloaded{" "}
                    {selectedMarketplacePlugin.downloads.toLocaleString()} times
                    and has a rating of {selectedMarketplacePlugin.rating}/5
                    stars.
                  </p>
                </div>
              </div>
            </ScrollArea>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <Plug size={64} className="mx-auto mb-4 opacity-20" />
              <p>Select an extension to view details</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
