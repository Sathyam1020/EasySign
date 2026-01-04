import React from "react";
import SignatureOverlay from "./SignatureOverlay";
import { PlacedSignature, ResizeHandle } from "./types";

type Props = {
  signatures: PlacedSignature[];
  currentPage: number;
  selectedSignatureId: string | null;
  onSelectSignature: (id: string) => void;
  onDeleteSignature: (id: string) => void;
  onDuplicateSignature: (id: string) => void;
  onCopySignatureToAllPages: (id: string) => void;
  onDragStart: (payload: {
    id: string;
    offsetX: number;
    offsetY: number;
  }) => void;
  onResizeStart: (payload: {
    id: string;
    startX: number;
    startY: number;
    startW: number;
    startH: number;
    startCX: number;
    startCY: number;
    handle: ResizeHandle;
  }) => void;
  onFontChange: (id: string, nextSize: number) => void;
  clampFont: (size: number) => number;
};

const SignatureLayer = ({
  signatures,
  currentPage,
  selectedSignatureId,
  onSelectSignature,
  onDeleteSignature,
  onDuplicateSignature,
  onCopySignatureToAllPages,
  onDragStart,
  onResizeStart,
  onFontChange,
  clampFont,
}: Props) => {
  return (
    <>
      {signatures
        .filter((sig) => sig.page === currentPage)
        .map((sig) => (
          <SignatureOverlay
            key={sig.id}
            sig={sig}
            selected={selectedSignatureId === sig.id}
            onSelect={() => onSelectSignature(sig.id)}
            onDelete={() => onDeleteSignature(sig.id)}
            onDuplicate={() => onDuplicateSignature(sig.id)}
            onCopyAll={() => onCopySignatureToAllPages(sig.id)}
            onDragStart={onDragStart}
            onResizeStart={onResizeStart}
            onFontChange={(next) => onFontChange(sig.id, next)}
            clampFont={clampFont}
          />
        ))}
    </>
  );
};

export default SignatureLayer;
