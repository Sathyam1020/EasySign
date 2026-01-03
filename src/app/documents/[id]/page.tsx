"use client";

import DocumentHeader from "@/components/documents/DocumentHeader";
import DocumentRightColumn from "@/components/documents/DocumentRightColumn";
import { Button } from "@/components/ui/button";
import {
  getDocumentMeta,
  getDocumentViewUrl,
} from "@/lib/services/documents/documents";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { pdfjs, Document, Page } from "react-pdf";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export default function DocumentViewer() {
  const { id } = useParams() as { id: string };

  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [meta, setMeta] = useState<any>(null);
  const [numPages, setNumPages] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const [loading, setLoading] = useState(true);
  const [pdfLoading, setPdfLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const metaRes = await getDocumentMeta(id);
        setMeta(metaRes);

        const { viewUrl } = await getDocumentViewUrl(id);
        setPdfUrl(viewUrl);
        console.log("PDF View URL:", viewUrl);
      } catch (err: any) {
        setError(err.message || "Failed to load document");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [id]);
  console.log(meta, "META");

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-xl font-semibold text-gray-700">
          Loading document…
        </div>
      </div>
    );

  if (error)
    return (
      <div className="min-h-screen flex items-center justify-center text-red-600 text-lg">
        {error}
      </div>
    );

  return (
    <div className="h-screen bg-white flex flex-col overflow-hidden">
      {/* Header */}
      <div className="shrink-0">
        <DocumentHeader fileName={meta?.fileName} fileStatus={meta?.status} />
      </div>

      {/* Viewer */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <div className="w-full h-full grid grid-cols-[20%_55%_25%]">
          {/* Left Col */}
          <div className="bg-[#f3f4f6] h-full overflow-y-auto">
            <div className="space-y-3">
              <div className="text-sm font-semibold text-gray-700">Fields</div>
              <div className="space-y-2">
                {["Signature", "Initials", "Date", "Textbox", "Checkbox"].map(
                  (label) => (
                    <div
                      key={label}
                      className="rounded-lg border border-dashed border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700"
                    >
                      {label}
                    </div>
                  )
                )}
              </div>
              <div className="text-sm font-semibold text-gray-700 pt-2">
                Signers
              </div>
              <div className="space-y-2">
                {["Alice Parker", "Bob Smith", "You"].map((name) => (
                  <div
                    key={name}
                    className="rounded-lg border border-gray-200 px-3 py-2 text-sm flex items-center justify-between"
                  >
                    <span className="text-gray-700">{name}</span>
                    <span className="text-xs text-gray-500">Pending</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Center Col  */}
          <div className="h-full overflow-y-auto flex flex-col items-center p-3 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {!pdfUrl ? (
              <div className="text-center text-gray-500">
                Could not load document.
              </div>
            ) : (
              <div className="w-full max-w-4xl">
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
                >
                  {pdfLoading && (
                    <div className="p-10 text-center text-gray-500">
                      Rendering PDF…
                    </div>
                  )}

                  {!pdfLoading && numPages && (
                    <>
                      {numPages > 1 && (
                        <div className="rounded-full flex items-center justify-center gap-3 px-3 py-2 bg-[#f3f4f6] sticky top-0 z-10">
                          <Button
                            className="px-3 py-1.5 rounded-lg border border-gray-300 text-xs font-semibold text-gray-600 bg-white hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                            onClick={() =>
                              setCurrentPage((prev) => Math.max(1, prev - 1))
                            }
                            disabled={currentPage === 1}
                          >
                            Previous
                          </Button>

                          <span className="text-xs text-gray-600 font-semibold">
                            Page {currentPage} of {numPages}
                          </span>

                          <Button
                            className="px-3 py-1.5 rounded-lg border border-gray-300 text-xs font-semibold text-gray-600 bg-white hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                            onClick={() =>
                              setCurrentPage((prev) =>
                                Math.min(numPages, prev + 1)
                              )
                            }
                            disabled={currentPage === numPages}
                          >
                            Next
                          </Button>
                        </div>
                      )}
                      <div className="p-2 mt-3 flex justify-center border border-black border-dashed items-center rounded-xl">
                        <Page
                          pageNumber={currentPage}
                          width={700}
                          renderAnnotationLayer={false}
                          renderTextLayer={false}
                        />
                      </div>
                    </>
                  )}
                </Document>
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
