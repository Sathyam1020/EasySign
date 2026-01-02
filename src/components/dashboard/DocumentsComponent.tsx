"use client";

import { useState } from "react";
import { CircleAlertIcon, PlusCircleIcon } from "lucide-react";

import { DocumentCard } from "./DocumentCard";
import { DashboardDocument, Theme } from "@/types/documents";
import { Button } from "../ui/button";
import { UploadDocumentModal } from "./UploadDocument";

type Props = {
  documents: DashboardDocument[];
};

const themes: Theme[] = [
  { base: "#FFE066", blob: "#C9A227" },
  { base: "#C9F2FF", blob: "#7EC4E4" },
  { base: "#FFD9EC", blob: "#E88BB5" },
  { base: "#E8FFD3", blob: "#95C97A" },
  { base: "#FFF2CC", blob: "#E6B95C" },
];

export default function DocumentsComponent({ documents }: Props) {
  const [openUpload, setOpenUpload] = useState(false);

  // sequential theme assignment that avoids repetition naturally
  const docsWithTheme = documents.map((doc, index) => ({
    ...doc,
    theme: themes[index % themes.length],
  }));

  // EMPTY STATE
  if (!documents || documents.length === 0) {
    return (
      <>
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
      </>
    );
  }

  // LIST VIEW
  return (
    <>
      <div className="flex gap-5 flex-wrap">
        {docsWithTheme.map((document) => (
          <DocumentCard
            key={document.id}
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
