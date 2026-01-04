import { CopyIcon, CopyPlusIcon, Trash2Icon } from "lucide-react";
import React from "react";
import { PlacedSignature } from "./types";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type DragStart = {
  id: string;
  offsetX: number;
  offsetY: number;
};

type ResizeStart = {
  id: string;
  startX: number;
  startY: number;
  startW: number;
  startH: number;
};

type Props = {
  sig: PlacedSignature;
  selected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onCopyAll: () => void;
  onDragStart: (payload: DragStart) => void;
  onResizeStart: (payload: ResizeStart) => void;
  onFontChange: (nextSize: number) => void;
  clampFont: (size: number) => number;
};

const SignatureOverlay = ({
  sig,
  selected,
  onSelect,
  onDelete,
  onDuplicate,
  onCopyAll,
  onDragStart,
  onResizeStart,
  onFontChange,
  clampFont,
}: Props) => {
  // Helper to convert hex to rgba with opacity
  const hexToRgba = (hex: string, opacity: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  };

  const hoverBgColor = hexToRgba(sig.color, 0.1);

  return (
    <div
      className="absolute group"
      style={{
        top: sig.y,
        left: sig.x,
        width: sig.width,
        height: sig.height,
        transform: "translate(-50%, -50%)",
      }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
    >
      <div
        className="w-full h-full rounded border shadow-sm bg-white/90 flex items-center justify-center text-sm font-semibold relative cursor-move transition-all hover:shadow-md select-none"
        style={{
          borderColor: sig.color,
          color: sig.color,
          fontSize: sig.fontSize,
        }}
        onPointerDown={(e) => {
          e.stopPropagation();
          // Calculate offset from the signature's center position (accounting for translate(-50%, -50%))
          onDragStart({
            id: sig.id,
            offsetX: sig.width / 2,
            offsetY: sig.height / 2,
          });
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = hoverBgColor;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.9)";
        }}
      >
        Signature
        {selected && (
          <>
            {/* Inline toolbar when selected */}
            <div className="absolute cursor-pointer -top-11 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-white border border-gray-200 rounded-md px-1 py-0.5 shadow-sm">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      className="h-7 w-7 cursor-pointer grid place-items-center rounded hover:bg-gray-100 text-gray-600"
                      onClick={(e) => {
                        e.stopPropagation();
                        onCopyAll();
                      }}
                    >
                      <CopyIcon className="h-4 w-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>Copy to all pages</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      className="h-7 w-7 cursor-pointer grid place-items-center rounded hover:bg-gray-100 text-gray-600"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDuplicate();
                      }}
                    >
                      <CopyPlusIcon className="h-4 w-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>Duplicate</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      className="h-7 w-7 grid cursor-pointer place-items-center rounded hover:bg-gray-100 text-red-600"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete();
                      }}
                    >
                      <Trash2Icon className="h-4 w-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>Remove</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            {/* Resize handle, only when selected */}
            <div
              className="absolute -bottom-2 -right-2 h-4 w-4 rounded-sm bg-white border border-dashed border-gray-400 cursor-se-resize"
              onPointerDown={(e) => {
                e.stopPropagation();
                onResizeStart({
                  id: sig.id,
                  startX: e.clientX,
                  startY: e.clientY,
                  startW: sig.width,
                  startH: sig.height,
                });
              }}
            />
          </>
        )}
      </div>
      <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[11px] text-gray-500 select-none">
        {sig.email}
      </div>
    </div>
  );
};

export default SignatureOverlay;
