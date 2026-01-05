"use client";

import { PlacedSignature } from "@/components/documents/signing/types";
import {
  getDocumentMeta,
  getDocumentViewUrl,
} from "@/lib/services/documents/documents";
import dynamic from "next/dynamic";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

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

export default function PreviewPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();

  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [meta, setMeta] = useState<any>(null);
  const [placedSignatures, setPlacedSignatures] = useState<PlacedSignature[]>(
    []
  );
  console.log(placedSignatures, "placedSignatures");
  const [numPages, setNumPages] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const raw =
      localStorage.getItem("previewData") ??
      sessionStorage.getItem("previewData");
    if (!raw) {
      setLoading(true);
      // Fallback: load doc so at least PDF shows
      Promise.all([getDocumentMeta(id), getDocumentViewUrl(id)])
        .then(([metaRes, urlRes]) => {
          setMeta(metaRes);
          setPdfUrl(urlRes.viewUrl ?? urlRes.data?.url ?? null);
        })
        .catch((err: any) => setError(err?.message ?? "Failed to load preview"))
        .finally(() => setLoading(false));
      return;
    }

    try {
      const parsed = JSON.parse(raw);
      setPlacedSignatures(parsed.placedSignatures ?? []);
      setNumPages(parsed.numPages ?? null);
      setPdfUrl(parsed.pdfUrl ?? null);
      setMeta(parsed.meta ?? null);
      // keep data around for refreshes; do not remove
    } catch (err: any) {
      setError(err?.message ?? "Failed to parse preview data");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      import("react-pdf").then((reactPdf) => {
        reactPdf.pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${reactPdf.pdfjs.version}/build/pdf.worker.min.mjs`;
      });
    }
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-12 w-12 border-4 border-gray-200 border-t-[#ff7f4a] rounded-full animate-spin" />
          <div className="text-xl font-semibold text-gray-700">
            Loading preview…
          </div>
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
    <div className="min-h-screen bg-white overflow-y-auto">
      <div className="flex flex-col items-center p-3">
        {!pdfUrl ? (
          <div className="text-center text-gray-500">No preview available.</div>
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
            onLoadError={(e) => setError(e.message)}
          >
            {numPages ? (
              <div className="w-full max-w-4xl">
                <div className="flex flex-col gap-8">
                  {Array.from({ length: numPages }, (_, i) => i + 1).map(
                    (page) => (
                      <div className="relative">
                        <div className="p-2 mt-3 flex justify-center border border-gray-200 items-center rounded-xl bg-gray-50 relative">
                          <Page
                            pageNumber={page}
                            width={700}
                            renderAnnotationLayer={false}
                            renderTextLayer={false}
                          />

                          {placedSignatures
                            .filter((s) => s.page === page)
                            .map((s) => (
                              <div
                                key={s.id}
                                className="absolute text-black flex items-center justify-center font-semibold pointer-events-none"
                                style={{
                                  top: s.y,
                                  left: s.x,
                                  width: s.width,
                                  height: s.height,
                                  transform: "translate(-45%, -30%)",
                                  //   borderColor: s.color,
                                  //   color: s.color,
                                  fontSize: s.fontSize,
                                  fontFamily:
                                    '"Pacifico", "Dancing Script", "Segoe Script", cursive',
                                  fontWeight: 600,
                                  letterSpacing: "0.03em",
                                }}
                              >
                                Signature
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
