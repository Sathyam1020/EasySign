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
import { useParams } from "next/navigation";
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
  const dropZoneRef = useRef<HTMLDivElement | null>(null);

  const clampFont = (size: number) => Math.min(48, Math.max(10, size));

  // Keep left-panel font slider in sync with the selected signature
  useEffect(() => {
    if (!selectedSignatureId) return;
    const active = placedSignatures.find((p) => p.id === selectedSignatureId);
    if (active) {
      setFontSize(active.fontSize);
    }
  }, [selectedSignatureId, placedSignatures]);

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
      if (!pdfContainerRef.current) return;
      e.preventDefault();
      const pdfRect = pdfContainerRef.current.getBoundingClientRect();

      // getBoundingClientRect() already accounts for scroll, just use it directly
      const x = e.clientX - pdfRect.left;
      const y = e.clientY - pdfRect.top;
      setPlacedSignatures((prev) =>
        prev.map((s) => (s.id === dragging.id ? { ...s, x, y } : s))
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
      if (!pdfContainerRef.current) return;
      e.preventDefault();
      const dx = e.clientX - resizing.startX;
      const dy = e.clientY - resizing.startY;
      setPlacedSignatures((prev) =>
        prev.map((s) =>
          s.id === resizing.id
            ? {
                ...s,
                width: Math.max(100, resizing.startW + dx),
                height: Math.max(32, resizing.startH + dy),
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
        <DocumentHeader fileName={meta?.fileName} fileStatus={meta?.status} />
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
                              pdfContainerRef.current?.getBoundingClientRect();
                            if (!pdfRect) return;
                            // getBoundingClientRect() already accounts for scroll, just use it directly
                            const x = e.clientX - pdfRect.left;
                            const y = e.clientY - pdfRect.top;
                            const color = getRecipientColor(
                              selectedRecipientEmail
                            );
                            const newId = `sig-${Date.now()}-${
                              placedSignatures.length
                            }`;
                            setPlacedSignatures((prev) => [
                              ...prev,
                              {
                                x,
                                y,
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
