import Editor, { type OnMount } from "@monaco-editor/react";
import { useSettingsStore } from "../../lib/settingsStore";
import { useRef } from "react";

interface CodeEditorProps {
  code: string;
  language?: string;
  onChange?: (value: string | undefined) => void;
}

export default function CodeEditor({
  code,
  language = "javascript",
  onChange,
}: CodeEditorProps) {
  const { settings } = useSettingsStore();
  const editorRef = useRef<any>(null);

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    // Add any custom keybindings or actions here
  };

  return (
    <div className="h-full w-full bg-[#1e1e1e]">
      <Editor
        height="100%"
        theme={settings.theme}
        path={language} // Helps with intellisense for same-file switching
        defaultLanguage={language}
        value={code}
        onChange={onChange}
        onMount={handleEditorDidMount}
        options={{
          minimap: { enabled: settings.minimap },
          fontSize: settings.fontSize,
          fontFamily: settings.fontFamily,
          wordWrap: settings.wordWrap,
          lineNumbers: settings.lineNumbers,
          scrollBeyondLastLine: false,
          automaticLayout: true,
          padding: { top: 16, bottom: 16 },
          smoothScrolling: true,
          cursorBlinking: "smooth",
          cursorSmoothCaretAnimation: "on",
          renderWhitespace: "selection",
        }}
      />
    </div>
  );
}
