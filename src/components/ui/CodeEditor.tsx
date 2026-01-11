import Editor, { type OnMount, loader } from "@monaco-editor/react";
import { useSettingsStore } from "../../lib/settingsStore";
import {
  useImperativeHandle,
  forwardRef,
  useRef,
  useState,
  memo,
} from "react";
import * as monaco from "monaco-editor";
self.MonacoEnvironment = {
  getWorkerUrl: function (_moduleId: string, label: string) {
    if (label === "json") {
      return "/node_modules/monaco-editor/esm/vs/language/json/json.worker.js";
    }
    if (label === "css" || label === "scss" || label === "less") {
      return "/node_modules/monaco-editor/esm/vs/language/css/css.worker.js";
    }
    if (label === "html" || label === "handlebars" || label === "razor") {
      return "/node_modules/monaco-editor/esm/vs/language/html/html.worker.js";
    }
    if (label === "typescript" || label === "javascript") {
      return "/node_modules/monaco-editor/esm/vs/language/typescript/ts.worker.js";
    }
    return "/node_modules/monaco-editor/esm/vs/editor/editor.worker.js";
  },
};
loader.config({ monaco });
loader.init().catch((err) => console.error("Failed to preload Monaco:", err));
let languagesConfigured = false;
const requestIdleCallback =
  window.requestIdleCallback || ((cb) => setTimeout(cb, 1));
interface CodeEditorProps {
  code: string;
  language?: string;
  filePath?: string;
  onChange?: (value: string | undefined) => void;
}
export interface CodeEditorHandle {
  getEditor: () => any;
}
const CodeEditor = forwardRef<CodeEditorHandle, CodeEditorProps>(
  ({ code, language = "javascript", filePath, onChange }, ref) => {
    const { settings } = useSettingsStore();
    const editorRef = useRef<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    useImperativeHandle(ref, () => ({
      getEditor: () => editorRef.current,
    }));
    const configureLanguages = (monaco: any) => {
      if (languagesConfigured) return;
      languagesConfigured = true;
      requestIdleCallback(() => {
        monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
          noSemanticValidation: false,
          noSyntaxValidation: false,
          diagnosticCodesToIgnore: [
            2307, 2552, 2304, 2874, 2584, 2693, 2339, 2580,
          ], // Ignore module, React, DOM, and property errors
        });
        monaco.languages.typescript.javascriptDefaults.setEagerModelSync(false);
        monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
          target: monaco.languages.typescript.ScriptTarget.Latest,
          allowNonTsExtensions: true,
          moduleResolution:
            monaco.languages.typescript.ModuleResolutionKind.NodeJs,
          module: monaco.languages.typescript.ModuleKind.ESNext,
          noEmit: true,
          esModuleInterop: true,
          jsx: monaco.languages.typescript.JsxEmit.React,
          reactNamespace: "React",
          allowJs: true,
          skipLibCheck: true,
          skipDefaultLibCheck: true,
          typeRoots: ["node_modules/@types"],
          lib: ["ES2020", "DOM", "DOM.Iterable", "WebWorker"],
        });
        monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
          noSemanticValidation: false,
          noSyntaxValidation: false,
          diagnosticCodesToIgnore: [
            2307, 2552, 2304, 2874, 2584, 2693, 2339, 2580,
          ], // Ignore module, React, DOM, and property errors
        });
        monaco.languages.typescript.typescriptDefaults.setEagerModelSync(false);
        monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
          target: monaco.languages.typescript.ScriptTarget.Latest,
          allowNonTsExtensions: true,
          moduleResolution:
            monaco.languages.typescript.ModuleResolutionKind.NodeJs,
          module: monaco.languages.typescript.ModuleKind.ESNext,
          noEmit: true,
          esModuleInterop: true,
          jsx: monaco.languages.typescript.JsxEmit.React,
          allowJs: true,
          skipLibCheck: true,
          skipDefaultLibCheck: true,
          typeRoots: ["node_modules/@types"],
          lib: ["ES2020", "DOM", "DOM.Iterable", "WebWorker"],
        });
        monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
          validate: true,
          allowComments: true,
          schemas: [],
          enableSchemaRequest: true,
        });
        monaco.languages.html.htmlDefaults.setOptions({
          format: {
            tabSize: 2,
            insertSpaces: true,
            wrapLineLength: 120,
            unformatted: "wbr",
            contentUnformatted: "pre,code,textarea",
            indentInnerHtml: false,
            preserveNewLines: true,
            maxPreserveNewLines: null,
            indentHandlebars: false,
            endWithNewline: false,
            extraLiners: "head, body, /html",
            wrapAttributes: "auto",
          },
          suggest: { html5: true },
        });
        monaco.languages.css.cssDefaults.setOptions({
          validate: true,
          lint: {
            compatibleVendorPrefixes: "ignore",
            vendorPrefix: "warning",
            duplicateProperties: "warning",
            emptyRules: "warning",
            importStatement: "ignore",
            boxModel: "ignore",
            universalSelector: "ignore",
            zeroUnits: "ignore",
            fontFaceProperties: "warning",
            hexColorLength: "error",
            argumentsInColorFunction: "error",
            unknownProperties: "warning",
            ieHack: "ignore",
            unknownVendorSpecificProperties: "ignore",
            propertyIgnoredDueToDisplay: "warning",
            important: "ignore",
            float: "ignore",
            idSelector: "ignore",
          },
        });
      });
    };
    const handleEditorDidMount: OnMount = (editor, monaco) => {
      editorRef.current = editor;
      configureLanguages(monaco);
      editor.addCommand(monaco.KeyCode.F12, () => {
        editor.trigger("keyboard", "editor.action.revealDefinition", {});
      });
      editor.addCommand(monaco.KeyMod.Shift | monaco.KeyCode.F12, () => {
        editor.trigger("keyboard", "editor.action.goToReferences", {});
      });
      editor.addCommand(monaco.KeyMod.Alt | monaco.KeyCode.F12, () => {
        editor.trigger("keyboard", "editor.action.peekDefinition", {});
      });
      setIsLoading(false);
    };
    return (
      <div className="h-full w-full bg-[#1e1e1e] relative">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#1e1e1e] z-10">
            <div className="text-gray-400 text-sm">Loading editor...</div>
          </div>
        )}
        <Editor
          height="100%"
          theme={settings.theme}
          path={filePath || `file.${language}`} // Use actual file path for proper language detection
          defaultLanguage={language}
          language={language}
          value={code}
          onChange={onChange}
          onMount={handleEditorDidMount}
          loading={
            <div className="flex items-center justify-center h-full text-gray-400 text-sm">
              Loading editor...
            </div>
          }
          options={{
            minimap: { enabled: settings.minimap },
            fontSize: settings.fontSize,
            fontFamily: settings.fontFamily,
            wordWrap: settings.wordWrap,
            lineNumbers: settings.lineNumbers,
            scrollBeyondLastLine: false,
            automaticLayout: true,
            padding: { top: 16, bottom: 16 },
            smoothScrolling: false, // Disable for better performance
            cursorBlinking: "smooth",
            cursorSmoothCaretAnimation: "off", // Disable for better performance
            renderWhitespace: "selection",
            scrollbar: {
              useShadows: false, // Reduce rendering overhead
              verticalScrollbarSize: 10,
              horizontalScrollbarSize: 10,
            },
            quickSuggestions: {
              other: "on",
              comments: false,
              strings: false,
            },
            quickSuggestionsDelay: 300, // Increased delay to reduce CPU usage
            parameterHints: {
              enabled: true,
              cycle: false,
            },
            suggestOnTriggerCharacters: true,
            acceptSuggestionOnCommitCharacter: true,
            tabCompletion: "on",
            wordBasedSuggestions: "matchingDocuments", // Limit scope for performance
            suggest: {
              showKeywords: true,
              showSnippets: true,
              showClasses: true,
              showFunctions: true,
              showVariables: true,
              showModules: true,
              showProperties: true,
              showValues: true,
              showColors: true,
              showFiles: false, // Disable file suggestions for performance
              showReferences: false, // Disable for performance
              showFolders: false,
              showTypeParameters: true,
              showIcons: true,
              filterGraceful: true,
              snippetsPreventQuickSuggestions: false,
            },
            find: {
              addExtraSpaceOnTop: false,
              autoFindInSelection: "never",
              seedSearchStringFromSelection: "never",
            },
            accessibilitySupport: "off", // Disable unless needed
            hover: {
              delay: 300, // Add delay to hover tooltips
            },
            glyphMargin: false, // Reduce rendering
            folding: true,
            foldingStrategy: "indentation", // Faster than auto
            showFoldingControls: "mouseover", // Only show when needed
            matchBrackets: "always",
            renderLineHighlight: "line",
            // occurrencesHighlight: false, // Disable to improve performance
            selectionHighlight: false, // Disable to improve performance
            codeLens: false, // Disable code lens for performance
            lightbulb: {
              // enabled: false, // Disable lightbulb for performance
            },
          }}
        />
      </div>
    );
  }
);
CodeEditor.displayName = "CodeEditor";
export default memo(CodeEditor, (prevProps, nextProps) => {
  return (
    prevProps.code === nextProps.code &&
    prevProps.language === nextProps.language &&
    prevProps.filePath === nextProps.filePath
  );
});