// app/sign/[token]/page.tsx
"use client";

import dynamic from "next/dynamic";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getSigningData } from "@/lib/services/documents/signing";
import SignHeader from "@/components/sign/SignHeader";

const Document = dynamic(
  () => import("react-pdf").then((mod) => mod.Document),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center gap-3 py-10 text-gray-700">
        <div className="h-10 w-10 border-4 border-gray-200 border-t-[#ff7f4a] rounded-full animate-spin" />
        <span className="font-medium">Loading PDF viewer…</span>
      </div>
    ),
  }
);

const Page = dynamic(() => import("react-pdf").then((mod) => mod.Page), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center gap-3 py-6 text-gray-700">
      <div className="h-8 w-8 border-4 border-gray-200 border-t-[#ff7f4a] rounded-full animate-spin" />
      <span className="text-sm font-medium">Loading page…</span>
    </div>
  ),
});

export default function SignPage() {
  const { token } = useParams() as { token: string };

  const [numPages, setNumPages] = useState<number | null>(null);
  const [pdfError, setPdfError] = useState<string | null>(null);

  const {
    data: signingData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["signing", token],
    queryFn: () => getSigningData(token),
    enabled: !!token,
  });

  const pdfUrl = signingData?.document.fileUrl;

  // Set up PDF.js worker
  useEffect(() => {
    if (typeof window !== "undefined") {
      import("react-pdf").then((reactPdf) => {
        reactPdf.pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${reactPdf.pdfjs.version}/build/pdf.worker.min.mjs`;
      });
    }
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-12 w-12 border-4 border-gray-200 border-t-[#ff7f4a] rounded-full animate-spin" />
          <div className="text-xl font-semibold text-gray-700">
            Loading document…
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-600 text-lg">
        {error instanceof Error ? error.message : "Failed to load document"}
      </div>
    );
  }

  if (!signingData || !pdfUrl) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600 text-lg">
        No document available
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 overflow-y-auto">
      {/* Header Info */}
      <SignHeader signingData={signingData} token={token} />
      {/* PDF Document */}
      <div className="flex flex-col items-center p-3 shadow-sm">
        {!pdfUrl ? (
          <div className="text-center text-gray-500">
            No document available.
          </div>
        ) : (
          <Document
            file={pdfUrl}
            onLoadSuccess={({ numPages }) => setNumPages(numPages)}
            loading={
              <div className="p-6 flex items-center justify-center gap-3 text-gray-700">
                <div className="h-8 w-8 border-4 border-gray-200 border-t-[#ff7f4a] rounded-full animate-spin" />
                <span className="text-sm font-medium">Rendering…</span>
              </div>
            }
            onLoadError={(e) => setPdfError(e.message)}
          >
            {numPages ? (
              <div className="w-full max-w-4xl">
                <div className="flex flex-col gap-8">
                  {Array.from({ length: numPages }, (_, i) => i + 1).map(
                    (pageNum) => (
                      <div key={pageNum} className="relative">
                        <div className="p-2 mt-3 flex justify-center border border-gray-200 items-center rounded-xl bg-gray-50 relative">
                          <Page
                            pageNumber={pageNum}
                            width={700}
                            renderAnnotationLayer={false}
                            renderTextLayer={false}
                          />

                          {/* Render signature fields for this page */}
                          {signingData.fields
                            .filter((field) => field.pageNumber === pageNum)
                            .map((field) => (
                              <div
                                key={field.id}
                                className="absolute group"
                                style={{
                                  top: field.y,
                                  left: field.x,
                                  width: field.width,
                                  height: field.height,
                                  transform: "translate(-45%, -30%)",
                                }}
                              >
                                <div
                                  className="w-full h-full rounded border shadow-sm bg-white/90 flex items-center justify-center text-sm font-semibold relative cursor-pointer transition-colors duration-200 select-none"
                                  style={{
                                    borderColor: "#ff7f4a",
                                    color: "#ff7f4a",
                                    fontSize: field.fontSize,
                                    fontFamily:
                                      '"Pacifico", "Dancing Script", "Segoe Script", cursive',
                                    fontWeight: 600,
                                    letterSpacing: "0.03em",
                                  }}
                                >
                                  {field.value || "Signature"}
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>
            ) : (
              <div className="p-6 flex items-center justify-center gap-3 text-gray-700">
                <div className="h-8 w-8 border-4 border-gray-200 border-t-[#ff7f4a] rounded-full animate-spin" />
                <span className="text-sm font-medium">Loading pages…</span>
              </div>
            )}
          </Document>
        )}
      </div>
    </div>
  );
}
