// components/documents/signing/PDFCanvas.tsx
"use client";

import { useRef, useEffect } from "react";
import dynamic from "next/dynamic";
import { PlacedSignature, DragState, ResizeState } from "./types";
import SignatureLayer from "./SignatureLayer";
import { useSignatureDragAndResize } from "@/hooks/useSignatureDragAndResize";

// Dynamic imports for PDF components
const Document = dynamic(
  () => import("react-pdf").then((mod) => mod.Document),
  { ssr: false, loading: () => <p>Loading PDF viewer...</p> }
);

const Page = dynamic(() => import("react-pdf").then((mod) => mod.Page), {
  ssr: false,
  loading: () => <p>Loading page…</p>,
});

interface PDFCanvasProps {
  pdfUrl: string;
  currentPage: number;
  numPages: number | null;
  signatures: PlacedSignature[];
  selectedSignatureId: string | null;
  selectedTool: "signature" | null;
  selectedRecipientEmail: string;
  fontSize: number;
  recipientColor: string;
  onNumPagesLoad: (numPages: number) => void;
  onSelectSignature: (id: string) => void;
  onDeleteSignature: (id: string) => void;
  onDuplicateSignature: (id: string) => void;
  onCopySignatureToAllPages: (id: string) => void;
  onUpdateSignature: (id: string, updates: Partial<PlacedSignature>) => void;
  onCreateSignature: (signature: Omit<PlacedSignature, "id">) => void;
  onSignatureFontChange: (id: string, fontSize: number) => void;
  onClearSelection: () => void;
  canPlaceFields: boolean;
}

/**
 * PDFCanvas
 *
 * Renders the PDF document with signature overlays.
 * Handles drag-and-drop of new signatures and drag/resize of existing ones.
 *
 * @param pdfUrl - URL of the PDF document
 * @param currentPage - Current page number (1-indexed)
 * @param signatures - Array of placed signature fields
 * @param selectedSignatureId - ID of the currently selected signature
 * @param onUpdateSignature - Callback to update signature position/size
 * @param onCreateSignature - Callback to create a new signature field
 */
export function PDFCanvas({
  pdfUrl,
  currentPage,
  numPages,
  signatures,
  selectedSignatureId,
  selectedTool,
  selectedRecipientEmail,
  fontSize,
  recipientColor,
  onNumPagesLoad,
  onSelectSignature,
  onDeleteSignature,
  onDuplicateSignature,
  onCopySignatureToAllPages,
  onUpdateSignature,
  onCreateSignature,
  onSignatureFontChange,
  onClearSelection,
  canPlaceFields,
}: PDFCanvasProps) {
  const pageRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Use drag and resize hook
  const { setDragging, setResizing, clampPositionToPage, clampSizeToPage } =
    useSignatureDragAndResize({
      pageRef,
      signatures,
      onUpdateSignature,
    });

  const clampFont = (size: number) => Math.min(48, Math.max(10, size));

  // Handle PDF load
  const handleDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    onNumPagesLoad(numPages);
  };

  // Handle signature drop from toolbox
  const handleDrop = (e: React.DragEvent) => {
    if (selectedTool !== "signature") return;
    if (!selectedRecipientEmail || !canPlaceFields) return;

    e.preventDefault();

    const pdfRect = pageRef.current?.getBoundingClientRect();
    if (!pdfRect) return;

    const x = e.clientX - pdfRect.left;
    const y = e.clientY - pdfRect.top;

    const defaultWidth = 150;
    const defaultHeight = 42;

    const { x: clampedX, y: clampedY } = clampPositionToPage(
      x,
      y,
      defaultWidth,
      defaultHeight
    );

    const newSignature: Omit<PlacedSignature, "id"> = {
      x: clampedX,
      y: clampedY,
      fontSize: clampFont(fontSize),
      email: selectedRecipientEmail,
      color: recipientColor,
      width: defaultWidth,
      height: defaultHeight,
      page: currentPage,
      fieldType: "signature",
      required: true,
    };

    onCreateSignature(newSignature);
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (selectedTool === "signature" && canPlaceFields) {
      e.preventDefault();
    }
  };

  // Handle drag start
  const handleDragStart = (payload: DragState) => {
    if (payload) setDragging(payload);
  };

  // Handle resize start
  const handleResizeStart = (payload: ResizeState) => {
    if (payload) setResizing(payload);
  };

  return (
    <div
      ref={containerRef}
      className="p-2 mt-3 flex justify-center border border-black border-dashed items-center rounded-xl bg-gray-50 relative"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <div ref={pageRef} className="relative inline-block">
        <Document
          file={pdfUrl}
          onLoadSuccess={handleDocumentLoadSuccess}
          loading={<div className="text-gray-500">Loading document...</div>}
          error={<div className="text-red-500">Failed to load document</div>}
        >
          <Page
            pageNumber={currentPage}
            width={700}
            renderAnnotationLayer={false}
            renderTextLayer={false}
            loading={<div className="text-gray-500">Loading page...</div>}
          />

          {/* Signature overlays */}
          <SignatureLayer
            signatures={signatures}
            currentPage={currentPage}
            selectedSignatureId={selectedSignatureId}
            onSelectSignature={onSelectSignature}
            onDeleteSignature={onDeleteSignature}
            onDuplicateSignature={onDuplicateSignature}
            onCopySignatureToAllPages={onCopySignatureToAllPages}
            onDragStart={handleDragStart}
            onResizeStart={handleResizeStart}
            onFontChange={onSignatureFontChange}
            clampFont={clampFont}
          />
        </Document>
      </div>
    </div>
  );
}
