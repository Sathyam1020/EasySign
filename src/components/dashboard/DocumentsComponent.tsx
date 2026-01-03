"use client";

import { useState } from "react";
import { CircleAlertIcon, PlusCircleIcon } from "lucide-react";

import { DocumentCard } from "./DocumentCard";
import { DashboardDocument, Theme } from "@/types/documents";
import { Button } from "../ui/button";
import { UploadDocumentModal } from "./UploadDocument";

type Props = {
  documents: DashboardDocument[];
  isLoading: boolean;
};

const themes: Theme[] = [
  { base: "#ffd700", blob: "#ccac02" },
  { base: "#C9F2FF", blob: "#7EC4E4" },
  { base: "#FFD9EC", blob: "#E88BB5" },
  { base: "#E8FFD3", blob: "#95C97A" },
  { base: "#FFF2CC", blob: "#E6B95C" },
];

export default function DocumentsComponent({ documents, isLoading }: Props) {
  const [openUpload, setOpenUpload] = useState(false);

  // loading state FIRST (important)
  if (isLoading) {
    return (
      <div className="mt-20 w-full bg-white rounded-3xl px-10 py-16 flex flex-col items-center justify-center gap-4">
        <div className="h-12 w-12 border-4 border-gray-300 border-t-[#ff7f4a] rounded-full animate-spin" />
        <p className="text-gray-500 text-lg font-semibold">
          Fetching documents…
        </p>
      </div>
    );
  }

  // assign themes only once we HAVE docs
  const docsWithTheme = (documents || []).map((doc, index) => ({
    ...doc,
    theme: themes[index % themes.length],
  }));

  // empty state
  if (!documents || documents.length === 0) {
    return (
      <div>
        <div className="w-full bg-white rounded-3xl flex flex-col items-center justify-center gap-4 mt-20 px-10 py-16">
          <CircleAlertIcon className="h-9 w-9 text-gray-500" />

          <div className="text-gray-500">
            No documents created in this workspace yet.
          </div>

          <Button
            onClick={() => setOpenUpload(true)}
            className="bg-white border border-gray-300 rounded-xl text-gray-600 font-bold 
                       shadow-sm transition-all duration-200 
                       hover:scale-105 hover:shadow-md"
          >
            <PlusCircleIcon className="text-gray-600 mr-1" />
            Add document
          </Button>
        </div>

        <UploadDocumentModal
          open={openUpload}
          onClose={() => setOpenUpload(false)}
        />
      </div>
    );
  }

  // list view
  return (
    <>
      <div className="flex gap-5 flex-wrap">
        {docsWithTheme.map((document) => (
          <DocumentCard
            key={document.id}
            id={document.id}
            name={document.fileName}
            theme={document.theme}
            status={document.status}
          />
        ))}
      </div>

      <UploadDocumentModal
        open={openUpload}
        onClose={() => setOpenUpload(false)}
      />
    </>
  );
}
