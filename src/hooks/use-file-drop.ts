import { useEffect, useRef, useState } from "react";
import { logInfo } from "../lib/analytics/otel";
import { trackEvent } from "../lib/analytics/track";

export function useFileDrop(onFile: (file: File) => void) {
  const [isDragging, setIsDragging] = useState(false);
  const depthRef = useRef(0);
  const draggingRef = useRef(false);
  const handlerRef = useRef(onFile);
  handlerRef.current = onFile;

  useEffect(() => {
    const onDragEnter = (e: DragEvent) => {
      e.preventDefault();
      depthRef.current += 1;
      if (!draggingRef.current) {
        draggingRef.current = true;
        setIsDragging(true);
      }
    };
    const onDragOver = (e: DragEvent) => {
      e.preventDefault();
      if (e.dataTransfer) e.dataTransfer.dropEffect = "copy";
    };
    const onDragLeave = (e: DragEvent) => {
      e.preventDefault();
      depthRef.current -= 1;
      if (depthRef.current <= 0) {
        depthRef.current = 0;
        draggingRef.current = false;
        setIsDragging(false);
      }
    };
    const onDrop = (e: DragEvent) => {
      e.preventDefault();
      depthRef.current = 0;
      draggingRef.current = false;
      setIsDragging(false);
      const file = e.dataTransfer?.files?.[0];
      if (file) {
        logInfo("file dropped", { name: file.name, size: file.size, type: file.type });
        trackEvent("file_drop", { name: file.name, size: file.size, type: file.type });
        handlerRef.current(file);
      }
    };

    window.addEventListener("dragenter", onDragEnter);
    window.addEventListener("dragover", onDragOver);
    window.addEventListener("dragleave", onDragLeave);
    window.addEventListener("drop", onDrop);
    return () => {
      window.removeEventListener("dragenter", onDragEnter);
      window.removeEventListener("dragover", onDragOver);
      window.removeEventListener("dragleave", onDragLeave);
      window.removeEventListener("drop", onDrop);
    };
  }, []);

  return isDragging;
}
