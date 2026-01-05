// hooks/useSignatureDragAndResize.ts
import { useState, useEffect, useRef, useCallback } from "react";
import {
  DragState,
  ResizeState,
  PlacedSignature,
} from "@/components/documents/signing/types";

interface UseDragAndResizeProps {
  pageRef: React.RefObject<HTMLDivElement | null>;
  signatures: PlacedSignature[];
  onUpdateSignature: (id: string, updates: Partial<PlacedSignature>) => void;
}

export function useSignatureDragAndResize({
  pageRef,
  signatures,
  onUpdateSignature,
}: UseDragAndResizeProps) {
  const [dragging, setDragging] = useState<DragState>(null);
  const [resizing, setResizing] = useState<ResizeState>(null);

  const clampPositionToPage = useCallback(
    (x: number, y: number, width: number, height: number) => {
      const rect = pageRef.current?.getBoundingClientRect();
      if (!rect) return { x, y };

      const halfW = width / 2;
      const halfH = height / 2;
      const minX = halfW;
      const maxX = Math.max(halfW, rect.width - halfW);
      const minY = halfH;
      const maxY = Math.max(halfH, rect.height - halfH);

      return {
        x: Math.min(Math.max(x, minX), maxX),
        y: Math.min(Math.max(y, minY), maxY),
      };
    },
    []
  );

  const clampSizeToPage = useCallback((width: number, height: number) => {
    const rect = pageRef.current?.getBoundingClientRect();
    if (!rect) return { width, height };
    return {
      width: Math.min(width, rect.width),
      height: Math.min(height, rect.height),
    };
  }, []);

  // Handle dragging
  useEffect(() => {
    if (!dragging) return;

    const handleMove = (e: PointerEvent) => {
      if (!pageRef.current) return;
      e.preventDefault();

      const rect = pageRef.current.getBoundingClientRect();
      const newX = e.clientX - rect.left;
      const newY = e.clientY - rect.top;

      const sig = signatures.find((s) => s.id === dragging.id);
      if (!sig) return;

      const { x: clampedX, y: clampedY } = clampPositionToPage(
        newX,
        newY,
        sig.width,
        sig.height
      );

      onUpdateSignature(dragging.id, {
        x: clampedX,
        y: clampedY,
      });
    };

    const handleUp = () => {
      setDragging(null);
    };

    document.addEventListener("pointermove", handleMove);
    document.addEventListener("pointerup", handleUp);

    return () => {
      document.removeEventListener("pointermove", handleMove);
      document.removeEventListener("pointerup", handleUp);
    };
  }, [dragging, signatures, pageRef, clampPositionToPage, onUpdateSignature]);

  // Handle resizing
  useEffect(() => {
    if (!resizing) return;

    const handleMove = (e: PointerEvent) => {
      e.preventDefault();

      const deltaX = e.clientX - resizing.startX;
      const deltaY = e.clientY - resizing.startY;

      let newW = resizing.startW;
      let newH = resizing.startH;
      let newCX = resizing.startCX;
      let newCY = resizing.startCY;

      const handle = resizing.handle;
      const aspectRatio = resizing.startW / resizing.startH;

      // Handle horizontal changes
      if (handle.includes("e")) {
        newW = Math.max(50, resizing.startW + deltaX);
      } else if (handle.includes("w")) {
        newW = Math.max(50, resizing.startW - deltaX);
      }

      // Handle vertical changes
      if (handle.includes("s")) {
        newH = Math.max(30, resizing.startH + deltaY);
      } else if (handle.includes("n")) {
        newH = Math.max(30, resizing.startH - deltaY);
      }

      // Maintain aspect ratio for corner handles
      if (handle.length === 2) {
        const newAspect = newW / newH;
        if (newAspect > aspectRatio) {
          newW = newH * aspectRatio;
        } else {
          newH = newW / aspectRatio;
        }
      }

      // Clamp size
      const { width: clampedW, height: clampedH } = clampSizeToPage(newW, newH);
      newW = clampedW;
      newH = clampedH;

      // Adjust center position
      if (handle.includes("w")) {
        newCX = resizing.startCX - (newW - resizing.startW) / 2;
      } else if (handle.includes("e")) {
        newCX = resizing.startCX + (newW - resizing.startW) / 2;
      }

      if (handle.includes("n")) {
        newCY = resizing.startCY - (newH - resizing.startH) / 2;
      } else if (handle.includes("s")) {
        newCY = resizing.startCY + (newH - resizing.startH) / 2;
      }

      // Clamp position
      const { x: finalX, y: finalY } = clampPositionToPage(
        newCX,
        newCY,
        newW,
        newH
      );

      onUpdateSignature(resizing.id, {
        x: finalX,
        y: finalY,
        width: newW,
        height: newH,
      });
    };

    const handleUp = () => {
      setResizing(null);
    };

    document.addEventListener("pointermove", handleMove);
    document.addEventListener("pointerup", handleUp);

    return () => {
      document.removeEventListener("pointermove", handleMove);
      document.removeEventListener("pointerup", handleUp);
    };
  }, [resizing, clampPositionToPage, clampSizeToPage, onUpdateSignature]);

  return {
    dragging,
    resizing,
    setDragging,
    setResizing,
    clampPositionToPage,
    clampSizeToPage,
  };
}
