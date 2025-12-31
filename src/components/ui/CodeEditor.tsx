import Editor from "@monaco-editor/react";

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
  return (
    <div className="h-full w-full bg-[#1e1e1e]">
      <Editor
        height="100%"
        theme="vs-dark"
        path={language}
        defaultLanguage={language}
        value={code}
        onChange={onChange}
        options={{
          minimap: { enabled: true },
          fontSize: 14,
          scrollBeyondLastLine: false,
          automaticLayout: true,
          fontFamily: "'Fira Code', monospace",
        }}
      />
    </div>
  );
}
