import { useState, useRef, useEffect } from "react";
import {
  Smartphone,
  Wifi,
  WifiOff,
  Loader2,
  X,
  CheckCircle2,
  AlertCircle,
  Play,
  Monitor,
} from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { motion, AnimatePresence } from "motion/react";
import { useEditorStore } from "../lib/store";
import { invoke } from "@tauri-apps/api/core";

export default function AdbWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"devices" | "emulators">(
    "devices"
  );
  const [host, setHost] = useState("localhost");
  const [port, setPort] = useState("5555");
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<{
    type: "success" | "error" | "info" | null;
    message: string;
  }>({ type: null, message: "" });

  const { adbDevices, setAdbDevices, avdList, setAvdList } = useEditorStore();
  const widgetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        widgetRef.current &&
        !widgetRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Fetch connected devices on mount
  useEffect(() => {
    fetchDevices();
    fetchAvds();
  }, []);

  const fetchAvds = async () => {
    try {
      const result = await invoke<string>("emulator_list_avds");
      const avds = result.split("\n").filter((line) => line.trim());
      setAvdList(avds);
    } catch (err) {
      console.error("Failed to get AVD list:", err);
    }
  };

  const fetchDevices = async () => {
    try {
      const result = await invoke<string>("adb_devices");
      const devices = parseAdbDevices(result);
      setAdbDevices(devices);
    } catch (err) {
      console.error("Failed to get ADB devices:", err);
    }
  };

  const parseAdbDevices = (output: string): string[] => {
    const lines = output.split("\n").filter((line) => line.trim());
    const devices: string[] = [];

    lines.forEach((line) => {
      if (line.includes("\tdevice") || line.includes("  device")) {
        const deviceId = line.split(/\s+/)[0];
        if (deviceId && deviceId !== "List") {
          devices.push(deviceId);
        }
      }
    });

    return devices;
  };

  const handleConnect = async () => {
    if (!host || !port) {
      setConnectionStatus({
        type: "error",
        message: "Please enter both host and port",
      });
      return;
    }

    setIsConnecting(true);
    setConnectionStatus({ type: "info", message: "Connecting..." });

    try {
      const address = `${host}:${port}`;
      const result = await invoke<string>("adb_connect", { address });

      if (
        result.toLowerCase().includes("connected") ||
        result.toLowerCase().includes("already connected")
      ) {
        setConnectionStatus({
          type: "success",
          message: `Connected to ${address}`,
        });
        await fetchDevices();
      } else if (
        result.toLowerCase().includes("unable") ||
        result.toLowerCase().includes("failed")
      ) {
        setConnectionStatus({
          type: "error",
          message: `Failed: ${result}`,
        });
      } else {
        setConnectionStatus({
          type: "info",
          message: result,
        });
      }
    } catch (err) {
      setConnectionStatus({
        type: "error",
        message: `Error: ${err}`,
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async (device: string) => {
    try {
      await invoke<string>("adb_disconnect", { device });
      setConnectionStatus({
        type: "success",
        message: `Disconnected from ${device}`,
      });
      await fetchDevices();
    } catch (err) {
      setConnectionStatus({
        type: "error",
        message: `Failed to disconnect: ${err}`,
      });
    }
  };

  const handleStartEmulator = async (avdName: string) => {
    setConnectionStatus({ type: "info", message: `Starting ${avdName}...` });
    try {
      const result = await invoke<string>("emulator_start", { avdName });
      setConnectionStatus({
        type: "success",
        message: result,
      });
      // Refresh devices after a delay
      setTimeout(() => {
        fetchDevices();
      }, 5000);
    } catch (err) {
      setConnectionStatus({
        type: "error",
        message: `Failed to start emulator: ${err}`,
      });
    }
  };

  const getStatusIcon = () => {
    if (adbDevices.length > 0) {
      return <Wifi size={14} className="text-green-400" />;
    }
    return <WifiOff size={14} className="text-gray-400" />;
  };

  return (
    <div className="relative" ref={widgetRef}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="h-6 px-2 hover:bg-[#3c3c3c] text-gray-400 hover:text-white rounded flex items-center gap-1.5"
        title="ADB Connection"
      >
        <Smartphone size={14} />
        {getStatusIcon()}
        {adbDevices.length > 0 && (
          <span className="text-[10px] bg-green-500 text-white rounded-full w-4 h-4 flex items-center justify-center">
            {adbDevices.length}
          </span>
        )}
      </Button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-1/2 -translate-x-1/2 mt-1 bg-[#252526] border border-[#454545] rounded shadow-xl z-50 w-80"
          >
            {/* Tabs */}
            <div className="flex border-b border-[#333]">
              <Button
                variant="ghost"
                onClick={() => setActiveTab("devices")}
                className={`flex-1 px-4 py-2 text-xs font-medium transition-colors h-auto rounded-none ${
                  activeTab === "devices"
                    ? "text-white border-b-2 border-blue-500 bg-transparent hover:bg-transparent"
                    : "text-gray-400 hover:text-white hover:bg-transparent"
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <Smartphone size={14} />
                  Devices ({adbDevices.length})
                </div>
              </Button>
              <Button
                variant="ghost"
                onClick={() => setActiveTab("emulators")}
                className={`flex-1 px-4 py-2 text-xs font-medium transition-colors h-auto rounded-none ${
                  activeTab === "emulators"
                    ? "text-white border-b-2 border-blue-500 bg-transparent hover:bg-transparent"
                    : "text-gray-400 hover:text-white hover:bg-transparent"
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <Monitor size={14} />
                  Emulators ({avdList.length})
                </div>
              </Button>
            </div>

            {activeTab === "devices" && (
              <>
                <div className="p-3 border-b border-[#333]">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium text-white">
                      Connect Device
                    </h3>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setIsOpen(false)}
                      className="h-5 w-5 text-gray-400 hover:text-white"
                    >
                      <X size={12} />
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <label className="text-xs text-gray-400 mb-1 block">
                        Host/IP
                      </label>
                      <Input
                        type="text"
                        value={host}
                        onChange={(e) => setHost(e.target.value)}
                        placeholder="localhost or 192.168.x.x"
                        className="bg-[#3c3c3c] border-[#3c3c3c] focus:border-[#007fd4] text-white text-sm h-8"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-gray-400 mb-1 block">
                        Port
                      </label>
                      <Input
                        type="text"
                        value={port}
                        onChange={(e) => setPort(e.target.value)}
                        placeholder="5555"
                        className="bg-[#3c3c3c] border-[#3c3c3c] focus:border-[#007fd4] text-white text-sm h-8"
                      />
                    </div>

                    <Button
                      onClick={handleConnect}
                      disabled={isConnecting}
                      className="w-full bg-[#007fd4] hover:bg-[#006bb3] text-white h-8 text-xs"
                    >
                      {isConnecting ? (
                        <>
                          <Loader2 size={12} className="mr-2 animate-spin" />
                          Connecting...
                        </>
                      ) : (
                        <>
                          <Wifi size={12} className="mr-2" />
                          Connect
                        </>
                      )}
                    </Button>
                  </div>

                  {connectionStatus.type && (
                    <div
                      className={`mt-3 p-2 rounded text-xs flex items-start gap-2 ${
                        connectionStatus.type === "success"
                          ? "bg-green-500/10 text-green-400"
                          : connectionStatus.type === "error"
                          ? "bg-red-500/10 text-red-400"
                          : "bg-blue-500/10 text-blue-400"
                      }`}
                    >
                      {connectionStatus.type === "success" && (
                        <CheckCircle2 size={14} className="mt-0.5 shrink-0" />
                      )}
                      {connectionStatus.type === "error" && (
                        <AlertCircle size={14} className="mt-0.5 shrink-0" />
                      )}
                      {connectionStatus.type === "info" && (
                        <Loader2
                          size={14}
                          className="mt-0.5 shrink-0 animate-spin"
                        />
                      )}
                      <span className="break-all">
                        {connectionStatus.message}
                      </span>
                    </div>
                  )}
                </div>

                {/* Connected Devices */}
                <div className="p-3">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-medium text-gray-400 uppercase">
                      Connected Devices
                    </h4>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={fetchDevices}
                      className="h-5 w-5 text-gray-400 hover:text-white"
                      title="Refresh"
                    >
                      <Loader2 size={12} />
                    </Button>
                  </div>

                  {adbDevices.length === 0 ? (
                    <div className="text-xs text-gray-500 text-center py-3">
                      No devices connected
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {adbDevices.map((device) => (
                        <div
                          key={device}
                          className="flex items-center justify-between bg-[#1e1e1e] rounded p-2 group"
                        >
                          <div className="flex items-center gap-2">
                            <Smartphone size={12} className="text-green-400" />
                            <span className="text-xs text-gray-300 font-mono">
                              {device}
                            </span>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDisconnect(device)}
                            className="h-6 w-6 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-400"
                            title="Disconnect"
                          >
                            <X size={12} />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}

            {activeTab === "emulators" && (
              <div className="p-3">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-medium text-gray-400 uppercase">
                    Available Emulators
                  </h4>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={fetchAvds}
                    className="h-5 w-5 text-gray-400 hover:text-white"
                    title="Refresh"
                  >
                    <Loader2 size={12} />
                  </Button>
                </div>

                {connectionStatus.type && (
                  <div
                    className={`mb-3 p-2 rounded text-xs flex items-start gap-2 ${
                      connectionStatus.type === "success"
                        ? "bg-green-500/10 text-green-400"
                        : connectionStatus.type === "error"
                        ? "bg-red-500/10 text-red-400"
                        : "bg-blue-500/10 text-blue-400"
                    }`}
                  >
                    {connectionStatus.type === "success" && (
                      <CheckCircle2 size={14} className="mt-0.5 shrink-0" />
                    )}
                    {connectionStatus.type === "error" && (
                      <AlertCircle size={14} className="mt-0.5 shrink-0" />
                    )}
                    {connectionStatus.type === "info" && (
                      <Loader2
                        size={14}
                        className="mt-0.5 shrink-0 animate-spin"
                      />
                    )}
                    <span className="break-all">
                      {connectionStatus.message}
                    </span>
                  </div>
                )}

                {avdList.length === 0 ? (
                  <div className="text-xs text-gray-500 text-center py-3">
                    No emulators found
                  </div>
                ) : (
                  <div className="space-y-1">
                    {avdList.map((avd) => (
                      <div
                        key={avd}
                        className="flex items-center justify-between bg-[#1e1e1e] rounded p-2 group"
                      >
                        <div className="flex items-center gap-2">
                          <Monitor size={12} className="text-blue-400" />
                          <span className="text-xs text-gray-300">{avd}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleStartEmulator(avd)}
                          className="h-6 w-6 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-green-400"
                          title="Start Emulator"
                        >
                          <Play size={12} />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
