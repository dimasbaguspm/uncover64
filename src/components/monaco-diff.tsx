import { loader } from "@monaco-editor/react";
import { useEffect, useRef } from "react";
// @ts-expect-error scoped monaco entry has no bundled types
import * as monaco from "monaco-editor/esm/vs/editor/editor.api";
// @ts-expect-error scoped json contribution has no bundled types
import "monaco-editor/esm/vs/language/json/monaco.contribution";

loader.config({ monaco });

monaco.editor.defineTheme("uncover-dark", {
  base: "vs-dark",
  inherit: true,
  rules: [],
  colors: {
    "editor.background": "#131d17",
    "editor.foreground": "#c9a75c",
    "editorLineNumber.foreground": "#6e6a52",
    "editorLineNumber.activeForeground": "#c9a75c",
    "editorGutter.background": "#131d17",
    "editor.lineHighlightBackground": "#1d2a23",
    "editor.lineHighlightBorder": "#1d2a23",
    "diffEditor.insertedTextBackground": "#1f3d2fcc",
    "diffEditor.removedTextBackground": "#3d1f22cc",
    "diffEditor.insertedLineBackground": "#1f3d2f55",
    "diffEditor.removedLineBackground": "#3d1f2255",
  },
});

export type DiffLanguage = "json" | "plaintext";

type DiffEditorHandle = {
  updateOptions: (opts: Record<string, unknown>) => void;
};

export default function MonacoDiff({
  original,
  modified,
  language,
  wrap,
  fontSize,
}: {
  original: string;
  modified: string;
  language: DiffLanguage;
  wrap: boolean;
  fontSize: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<DiffEditorHandle | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const editor = monaco.editor.createDiffEditor(containerRef.current, {
      readOnly: true,
      renderSideBySide: true,
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      automaticLayout: true,
      lineNumbers: "on",
      fontSize,
      theme: "uncover-dark",
      wordWrap: wrap ? "on" : "off",
    });
    const originalModel = monaco.editor.createModel(original, language);
    const modifiedModel = monaco.editor.createModel(modified, language);
    editor.setModel({ original: originalModel, modified: modifiedModel });
    editorRef.current = editor;
    return () => {
      editorRef.current = null;
      editor.dispose();
      originalModel.dispose();
      modifiedModel.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    editorRef.current?.updateOptions({ wordWrap: wrap ? "on" : "off" });
  }, [wrap]);

  useEffect(() => {
    editorRef.current?.updateOptions({ fontSize });
  }, [fontSize]);

  return <div ref={containerRef} className="h-full w-full" />;
}
