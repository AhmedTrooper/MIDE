import Editor, { type OnMount } from "@monaco-editor/react";
import { useSettingsStore } from "../../lib/settingsStore";
import { useRef, useImperativeHandle, forwardRef, useEffect } from "react";

interface CodeEditorProps {
  code: string;
  language?: string;
  onChange?: (value: string | undefined) => void;
}

export interface CodeEditorHandle {
  getEditor: () => any;
}

const CodeEditor = forwardRef<CodeEditorHandle, CodeEditorProps>(
  ({ code, language = "javascript", onChange }, ref) => {
    const { settings } = useSettingsStore();
    const editorRef = useRef<any>(null);

    useImperativeHandle(ref, () => ({
      getEditor: () => editorRef.current,
    }));

    const handleEditorDidMount: OnMount = (editor, monaco) => {
      editorRef.current = editor;

      // Configure IntelliSense for all languages
      monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
        noSemanticValidation: false,
        noSyntaxValidation: false,
      });

      monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
        target: monaco.languages.typescript.ScriptTarget.Latest,
        allowNonTsExtensions: true,
        moduleResolution:
          monaco.languages.typescript.ModuleResolutionKind.NodeJs,
        module: monaco.languages.typescript.ModuleKind.CommonJS,
        noEmit: true,
        esModuleInterop: true,
        jsx: monaco.languages.typescript.JsxEmit.React,
        reactNamespace: "React",
        allowJs: true,
        typeRoots: ["node_modules/@types"],
      });

      monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
        noSemanticValidation: false,
        noSyntaxValidation: false,
      });

      monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
        target: monaco.languages.typescript.ScriptTarget.Latest,
        allowNonTsExtensions: true,
        moduleResolution:
          monaco.languages.typescript.ModuleResolutionKind.NodeJs,
        module: monaco.languages.typescript.ModuleKind.CommonJS,
        noEmit: true,
        esModuleInterop: true,
        jsx: monaco.languages.typescript.JsxEmit.ReactJSX,
        allowJs: true,
        typeRoots: ["node_modules/@types"],
      });

      // Configure other languages
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
    };

    return (
      <div className="h-full w-full bg-[#1e1e1e]">
        <Editor
          height="100%"
          theme={settings.theme}
          path={language} // Helps with intellisense for same-file switching
          defaultLanguage={language}
          language={language}
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
            // Enable IntelliSense features for all languages
            quickSuggestions: {
              other: true,
              comments: false,
              strings: true,
            },
            parameterHints: {
              enabled: true,
            },
            suggestOnTriggerCharacters: true,
            acceptSuggestionOnCommitCharacter: true,
            tabCompletion: "on",
            wordBasedSuggestions: "allDocuments",
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
              showFiles: true,
              showReferences: true,
              showFolders: true,
              showTypeParameters: true,
              showIcons: true,
            },
            find: {
              addExtraSpaceOnTop: false,
              autoFindInSelection: "never",
              seedSearchStringFromSelection: "never",
            },
          }}
        />
      </div>
    );
  }
);

CodeEditor.displayName = "CodeEditor";

export default CodeEditor;
