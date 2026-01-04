import { CopyIcon, CopyPlusIcon, Trash2Icon } from "lucide-react";
import React from "react";
import { PlacedSignature, ResizeHandle } from "./types";
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
  startCX: number;
  startCY: number;
  handle: ResizeHandle;
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

  const handleBaseClasses =
    "absolute h-3 w-3 bg-white border border-gray-400 rounded-none shadow-sm transition-all duration-150 ease-out opacity-80 group-hover:opacity-100 transform scale-90 group-hover:scale-100 hover:scale-110";

  const handleDefs: Array<{
    handle: ResizeHandle;
    positionClass: string;
    cursor: string;
  }> = [
    {
      handle: "nw",
      positionClass: "top-0 left-0 -translate-x-1/2 -translate-y-1/2",
      cursor: "cursor-nwse-resize",
    },
    {
      handle: "n",
      positionClass: "top-0 left-1/2 -translate-x-1/2 -translate-y-1/2",
      cursor: "cursor-n-resize",
    },
    {
      handle: "ne",
      positionClass: "top-0 right-0 translate-x-1/2 -translate-y-1/2",
      cursor: "cursor-nesw-resize",
    },
    {
      handle: "e",
      positionClass: "top-1/2 right-0 translate-x-1/2 -translate-y-1/2",
      cursor: "cursor-e-resize",
    },
    {
      handle: "se",
      positionClass: "bottom-0 right-0 translate-x-1/2 translate-y-1/2",
      cursor: "cursor-nwse-resize",
    },
    {
      handle: "s",
      positionClass: "bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2",
      cursor: "cursor-s-resize",
    },
    {
      handle: "sw",
      positionClass: "bottom-0 left-0 -translate-x-1/2 translate-y-1/2",
      cursor: "cursor-nesw-resize",
    },
    {
      handle: "w",
      positionClass: "top-1/2 left-0 -translate-x-1/2 -translate-y-1/2",
      cursor: "cursor-w-resize",
    },
  ];

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
        className="w-full h-full rounded border shadow-sm bg-white/90 flex items-center justify-center text-sm font-semibold relative cursor-pointer transition-colors duration-200 select-none"
        style={{
          borderColor: sig.color,
          color: sig.color,
          fontSize: sig.fontSize,
          fontFamily: '"Pacifico", "Dancing Script", "Segoe Script", cursive',
          fontWeight: 600,
          letterSpacing: "0.03em",
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
          e.currentTarget.style.transition = "background-color 400ms ease";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.9)";
          e.currentTarget.style.transition = "background-color 400ms ease";
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

            {/* Resize handles (8 points) */}
            {handleDefs.map((h) => (
              <div
                key={h.handle}
                className={`${handleBaseClasses} ${h.positionClass} ${h.cursor}`}
                onPointerDown={(e) => {
                  e.stopPropagation();
                  onResizeStart({
                    id: sig.id,
                    startX: e.clientX,
                    startY: e.clientY,
                    startW: sig.width,
                    startH: sig.height,
                    startCX: sig.x,
                    startCY: sig.y,
                    handle: h.handle,
                  });
                }}
              />
            ))}
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
