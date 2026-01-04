"use client";

import DocumentHeader from "@/components/documents/DocumentHeader";
import DocumentLeftCol from "@/components/documents/DocumentLeftCol";
import DocumentRightColumn from "@/components/documents/DocumentRightColumn";
import PaginationControls from "@/components/documents/signing/PaginationControls";
import SignatureLayer from "@/components/documents/signing/SignatureLayer";
import {
  DragState,
  PlacedSignature,
  ResizeState,
} from "@/components/documents/signing/types";
import {
  RecipientsProvider,
  useRecipients,
} from "@/components/documents/RecipientsProvider";
import {
  getDocumentMeta,
  getDocumentViewUrl,
} from "@/lib/services/documents/documents";
import dynamic from "next/dynamic";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

// Dynamic imports - NO SSR
const Document = dynamic(
  () => import("react-pdf").then((mod) => mod.Document),
  { ssr: false, loading: () => <p>Loading PDF viewer...</p> }
);

const Page = dynamic(() => import("react-pdf").then((mod) => mod.Page), {
  ssr: false,
  loading: () => <p>Loading page…</p>,
});

export default function DocumentViewer() {
  return (
    <RecipientsProvider>
      <DocumentViewerInner />
    </RecipientsProvider>
  );
}

function DocumentViewerInner() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const { selectedRecipientEmail, getRecipientColor, recipients } =
    useRecipients();

  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [meta, setMeta] = useState<any>(null);
  const [numPages, setNumPages] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedTool, setSelectedTool] = useState<"signature" | null>(null);
  const [fontSize, setFontSize] = useState<number>(16);
  const [placedSignatures, setPlacedSignatures] = useState<PlacedSignature[]>(
    []
  );
  const [selectedSignatureId, setSelectedSignatureId] = useState<string | null>(
    null
  );
  const [dragging, setDragging] = useState<DragState>(null);
  const [resizing, setResizing] = useState<ResizeState>(null);
  const [loading, setLoading] = useState(true);
  const [pdfLoading, setPdfLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const pdfContainerRef = useRef<HTMLDivElement | null>(null);
  const pageRef = useRef<HTMLDivElement | null>(null);
  const dropZoneRef = useRef<HTMLDivElement | null>(null);

  const clampFont = (size: number) => Math.min(48, Math.max(10, size));

  const clampPositionToPage = (
    x: number,
    y: number,
    width: number,
    height: number
  ) => {
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
  };

  const clampSizeToPage = (width: number, height: number) => {
    const rect = pageRef.current?.getBoundingClientRect();
    if (!rect) return { width, height };
    return {
      width: Math.min(width, rect.width),
      height: Math.min(height, rect.height),
    };
  };

  // Drop any signatures whose recipient has been removed
  useEffect(() => {
    const activeEmails = new Set(
      recipients.map((r) => r.email).filter(Boolean)
    );
    setPlacedSignatures((prev) =>
      prev.filter((p) => activeEmails.has(p.email))
    );
  }, [recipients]);

  // Keep left-panel font slider in sync with the selected signature
  useEffect(() => {
    if (!selectedSignatureId) return;
    const active = placedSignatures.find((p) => p.id === selectedSignatureId);
    if (active) {
      setFontSize(active.fontSize);
    }
  }, [selectedSignatureId, placedSignatures]);

  // Clear selection if its signature was pruned
  useEffect(() => {
    if (
      selectedSignatureId &&
      !placedSignatures.find((p) => p.id === selectedSignatureId)
    ) {
      setSelectedSignatureId(null);
      setSelectedTool(null);
    }
  }, [placedSignatures, selectedSignatureId]);

  const handleFontSizeChange = (size: number) => {
    const next = clampFont(size);
    setFontSize(next);
    if (!selectedSignatureId) return;
    setPlacedSignatures((prev) =>
      prev.map((p) =>
        p.id === selectedSignatureId ? { ...p, fontSize: next } : p
      )
    );
  };

  const handleSelectSignature = (id: string) => {
    setSelectedSignatureId(id);
    setSelectedTool("signature");
  };

  const handleDeleteSignature = (id: string) => {
    setPlacedSignatures((prev) => prev.filter((p) => p.id !== id));
    setSelectedSignatureId((prev) => (prev === id ? null : prev));
  };

  const handleDuplicateSignature = (id: string) => {
    let createdId: string | null = null;
    let createdFont = fontSize;
    setPlacedSignatures((prev) => {
      const source = prev.find((p) => p.id === id);
      if (!source) return prev;
      const newId = `sig-${Date.now()}-${prev.length}`;
      createdId = newId;
      createdFont = source.fontSize;
      const next = {
        ...source,
        id: newId,
        x: source.x + 16,
        y: source.y + 16,
      };
      return [...prev, next];
    });
    if (createdId) {
      setSelectedSignatureId(createdId);
      setFontSize(createdFont);
      setSelectedTool("signature");
    }
  };

  const handleCopySignatureToAllPages = (id: string) => {
    setPlacedSignatures((prev) => {
      const source = prev.find((p) => p.id === id);
      if (!source || !numPages) return prev;
      const additions: PlacedSignature[] = [];
      for (let page = 1; page <= numPages; page++) {
        if (page === source.page) continue;
        additions.push({
          ...source,
          id: `sig-${Date.now()}-${page}-${additions.length}`,
          page,
        });
      }
      return [...prev, ...additions];
    });
    setSelectedTool("signature");
  };

  const handleDragStart = (payload: NonNullable<DragState>) => {
    setDragging(payload);
  };

  const handleResizeStart = (payload: NonNullable<ResizeState>) => {
    setResizing(payload);
  };

  const handleSignatureFontChange = (id: string, nextSize: number) => {
    const next = clampFont(nextSize);
    setPlacedSignatures((prev) =>
      prev.map((p) => (p.id === id ? { ...p, fontSize: next } : p))
    );
    if (selectedSignatureId === id) {
      setFontSize(next);
    }
  };

  const handlePreview = () => {
    const payload = {
      placedSignatures,
      currentPage,
      numPages,
      pdfUrl,
      meta,
    };
    if (typeof window !== "undefined") {
      // localStorage so a new tab can read it
      localStorage.setItem("previewData", JSON.stringify(payload));
      window.open(`/documents/${id}/preview`, "_blank", "noopener,noreferrer");
    }
  };

  useEffect(() => {
    async function load() {
      try {
        const metaRes = await getDocumentMeta(id);
        setMeta(metaRes);

        const { viewUrl } = await getDocumentViewUrl(id);
        setPdfUrl(viewUrl);
      } catch (err: any) {
        setError(err.message || "Failed to load document");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [id]);

  // Set worker only in browser
  useEffect(() => {
    if (typeof window !== "undefined") {
      import("react-pdf").then((reactPdf) => {
        reactPdf.pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${reactPdf.pdfjs.version}/build/pdf.worker.min.mjs`;
      });
    }
  }, []);

  // Dragging handlers for placed signatures
  useEffect(() => {
    if (!dragging) return;

    const handleMove = (e: PointerEvent) => {
      if (!pageRef.current) return;
      e.preventDefault();
      const pdfRect = pageRef.current.getBoundingClientRect();

      // getBoundingClientRect() already accounts for scroll, just use it directly
      const x = e.clientX - pdfRect.left;
      const y = e.clientY - pdfRect.top;
      setPlacedSignatures((prev) =>
        prev.map((s) => {
          if (s.id !== dragging.id) return s;
          const { x: nextX, y: nextY } = clampPositionToPage(
            x,
            y,
            s.width,
            s.height
          );
          return { ...s, x: nextX, y: nextY };
        })
      );
    };

    const handleUp = () => setDragging(null);

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
    };
  }, [dragging]);

  // Resizing handlers
  useEffect(() => {
    if (!resizing) return;

    const handleMove = (e: PointerEvent) => {
      if (!pageRef.current) return;
      e.preventDefault();
      const dx = e.clientX - resizing.startX;
      const dy = e.clientY - resizing.startY;

      const minW = 100;
      const minH = 32;

      const startLeft = resizing.startCX - resizing.startW / 2;
      const startTop = resizing.startCY - resizing.startH / 2;

      let nextW = resizing.startW;
      let nextH = resizing.startH;
      let nextCX = resizing.startCX;
      let nextCY = resizing.startCY;

      const affectsEast = ["e", "ne", "se"].includes(resizing.handle);
      const affectsWest = ["w", "nw", "sw"].includes(resizing.handle);
      const affectsSouth = ["s", "se", "sw"].includes(resizing.handle);
      const affectsNorth = ["n", "ne", "nw"].includes(resizing.handle);

      if (affectsEast) {
        nextW = Math.max(minW, resizing.startW + dx);
        nextCX = startLeft + nextW / 2;
      }

      if (affectsWest) {
        nextW = Math.max(minW, resizing.startW - dx);
        const newLeft = startLeft + dx;
        nextCX = newLeft + nextW / 2;
      }

      if (affectsSouth) {
        nextH = Math.max(minH, resizing.startH + dy);
        nextCY = startTop + nextH / 2;
      }

      if (affectsNorth) {
        nextH = Math.max(minH, resizing.startH - dy);
        const newTop = startTop + dy;
        nextCY = newTop + nextH / 2;
      }

      const { width: boundedW, height: boundedH } = clampSizeToPage(
        nextW,
        nextH
      );

      const { x: boundedCX, y: boundedCY } = clampPositionToPage(
        nextCX,
        nextCY,
        boundedW,
        boundedH
      );

      setPlacedSignatures((prev) =>
        prev.map((s) =>
          s.id === resizing.id
            ? {
                ...s,
                width: boundedW,
                height: boundedH,
                x: boundedCX,
                y: boundedCY,
              }
            : s
        )
      );
    };

    const handleUp = () => setResizing(null);

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
    };
  }, [resizing]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-xl font-semibold text-gray-700">
          Loading document…
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-600 text-lg">
        {error}
      </div>
    );
  }

  return (
    <div className="h-screen bg-white flex flex-col overflow-hidden">
      {/* Header */}
      <div className="shrink-0">
        <DocumentHeader
          fileName={meta?.fileName}
          fileStatus={meta?.status}
          onPreview={handlePreview}
        />
      </div>

      {/* 3-Column Layout */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <div className="w-full h-full grid grid-cols-[20%_55%_25%]">
          {/* Left Col */}
          <DocumentLeftCol
            selectedTool={selectedTool}
            onSelectTool={(tool) => setSelectedTool(tool)}
            fontSize={fontSize}
            onChangeFontSize={handleFontSizeChange}
            hasSelectedSignature={Boolean(selectedSignatureId)}
          />

          {/* Center Col - PDF Viewer */}
          <div
            ref={dropZoneRef}
            className="h-full overflow-y-auto flex flex-col items-center p-3 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] relative"
            onClick={() => {
              setSelectedSignatureId(null);
              setSelectedTool(null);
            }}
          >
            {!pdfUrl ? (
              <div className="text-center text-gray-500">
                Could not load document.
              </div>
            ) : (
              <div className="w-full max-w-4xl">
                <div className="relative">
                  <Document
                    file={pdfUrl}
                    onLoadSuccess={({ numPages }) => {
                      setNumPages(numPages);
                      setCurrentPage(1);
                      setPdfLoading(false);
                    }}
                    onLoadError={(e) => {
                      setError("Failed to render PDF");
                      console.error(e);
                    }}
                    loading={
                      <div className="p-10 text-center text-gray-500">
                        Rendering PDF…
                      </div>
                    }
                  >
                    {pdfLoading && (
                      <div className="p-10 text-center text-gray-500">
                        Rendering PDF…
                      </div>
                    )}

                    {!pdfLoading && numPages && (
                      <>
                        <PaginationControls
                          currentPage={currentPage}
                          numPages={numPages}
                          onPrev={() =>
                            setCurrentPage((prev) => Math.max(1, prev - 1))
                          }
                          onNext={() =>
                            setCurrentPage((prev) =>
                              Math.min(numPages, prev + 1)
                            )
                          }
                        />

                        <div
                          ref={pdfContainerRef}
                          className="p-2 mt-3 flex justify-center border border-black border-dashed items-center rounded-xl bg-gray-50 relative"
                          onDragOver={(e) => {
                            if (
                              selectedTool === "signature" &&
                              recipients.length > 0
                            ) {
                              e.preventDefault();
                            }
                          }}
                          onDrop={(e) => {
                            if (selectedTool !== "signature") return;
                            if (
                              !selectedRecipientEmail ||
                              recipients.length === 0
                            )
                              return;
                            e.preventDefault();
                            const pdfRect =
                              pageRef.current?.getBoundingClientRect();
                            if (!pdfRect) return;
                            // getBoundingClientRect() already accounts for scroll, just use it directly
                            const x = e.clientX - pdfRect.left;
                            const y = e.clientY - pdfRect.top;
                            const { x: clampedX, y: clampedY } =
                              clampPositionToPage(x, y, 150, 42);
                            const color = getRecipientColor(
                              selectedRecipientEmail
                            );
                            const newId = `sig-${Date.now()}-${
                              placedSignatures.length
                            }`;
                            setPlacedSignatures((prev) => [
                              ...prev,
                              {
                                x: clampedX,
                                y: clampedY,
                                fontSize: clampFont(fontSize),
                                id: newId,
                                email: selectedRecipientEmail,
                                color,
                                width: 150,
                                height: 42,
                                page: currentPage,
                              },
                            ]);
                            setSelectedSignatureId(newId);
                            setSelectedTool("signature");
                          }}
                        >
                          <div ref={pageRef} className="relative inline-block">
                            <Page
                              pageNumber={currentPage}
                              width={700}
                              renderAnnotationLayer={false}
                              renderTextLayer={false}
                            />

                            <SignatureLayer
                              signatures={placedSignatures}
                              currentPage={currentPage}
                              selectedSignatureId={selectedSignatureId}
                              onSelectSignature={handleSelectSignature}
                              onDeleteSignature={handleDeleteSignature}
                              onDuplicateSignature={handleDuplicateSignature}
                              onCopySignatureToAllPages={
                                handleCopySignatureToAllPages
                              }
                              onDragStart={handleDragStart}
                              onResizeStart={handleResizeStart}
                              onFontChange={handleSignatureFontChange}
                              clampFont={clampFont}
                            />
                          </div>
                        </div>
                      </>
                    )}
                  </Document>
                </div>
              </div>
            )}
          </div>

          {/* Right Col */}
          <DocumentRightColumn />
        </div>
      </div>
    </div>
  );
}
