'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { pdfjs, Document, Page } from 'react-pdf';

// 1. Correct Worker Configuration (Standard for Next.js)
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export default function DocumentViewer() {
  const { id } = useParams() as { id: string };
  const [pdfUrl, setPdfUrl] = useState<string | null>(null); // Store the string URL
  const [numPages, setNumPages] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const getUrl = async () => {
      try {
        const res = await fetch(`/api/documents/view-url/${id}`);
        if (!res.ok) throw new Error('Failed to get view URL');
        const { viewUrl } = await res.json();
        
        setPdfUrl(viewUrl);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    if (id) getUrl();
  }, [id]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="pdf-container">
      <Document
        file={pdfUrl} // Pass the URL string directly here
        onLoadSuccess={({ numPages }) => setNumPages(numPages)}
        onLoadError={(err) => console.error("Render Error:", err)}
      >
        {Array.from(new Array(numPages), (el, index) => (
          <Page 
            key={`page_${index + 1}`} 
            pageNumber={index + 1} 
            renderTextLayer={false}
            renderAnnotationLayer={false}
          />
        ))}
      </Document>
    </div>
  );
}