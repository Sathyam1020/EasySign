"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Pencil, UploadCloud } from "lucide-react";
import { useRouter } from "next/navigation";

type Props = {
  open: boolean;
  onClose: () => void;
};

export function UploadDocumentModal({ open, onClose }: Props) {
  const router = useRouter();

  const [file, setFile] = useState<File | null>(null);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;

    // enforce single file + basic checks
    if (f.size > 15 * 1024 * 1024) {
      alert("File too large (max 15MB)");
      return;
    }

    setFile(f);
  }

  function removeFile() {
    setFile(null);
  }

  function handleNext() {
    if (!file) return;

    // Later this will actually upload -> get URL -> save in DB
    console.log("Selected file:", file);

    onClose();
    router.push("/documents");
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-[#faf7fd] rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl text-center font-semibold">
            Upload your file
          </DialogTitle>
        </DialogHeader>

        {/* FILE UPLOAD AREA */}
        {!file && (
          <label className="border-2 border-dashed border-gray-300 bg-white rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition">
            <UploadCloud className="h-8 w-8 text-gray-500 mb-2" />
            <p className="text-sm text-gray-600">
              Click to upload or drag & drop
            </p>
            <p className="text-xs text-gray-400 mt-1">
              PDF / DOCX only — up to 15MB
            </p>

            <Input
              type="file"
              accept=".pdf,.doc,.docx"
              className="hidden"
              onChange={handleFileSelect}
            />
          </label>
        )}

        {/* FILE SELECTED */}
        {file && (
          <div className="relative overflow-hidden rounded-2xl p-5 mb-3 shadow-sm border bg-white">
            {/* soft blob background */}
            <div className="absolute -top-6 -right-6 w-28 h-28 bg-white rounded-full blur-2xl opacity-60" />

            {/* content */}
            <div className="relative flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">

                <div>
                  <p className="text-sm font-semibold text-gray-800 truncate max-w-[200px]">
                    {file.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="shadow-sm border-gray-300"
                  onClick={() =>
                    document
                      .querySelector<HTMLInputElement>("input[type=file]")
                      ?.click()
                  }
                >
                  <Pencil className="h-4 w-4" />
                </Button>

                <Button variant="destructive" size="icon" onClick={removeFile}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* FOOTER */}
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>

          <Button
            disabled={!file}
            onClick={handleNext}
            className="bg-[#364152]"
          >
            Next
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
