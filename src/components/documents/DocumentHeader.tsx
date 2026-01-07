"use client";

import {
  ArrowLeft,
  CloudCheck,
  LucideEye,
  Play,
  RocketIcon,
  SaveIcon,
  Send,
  VideoIcon,
} from "lucide-react";
import { Button } from "../ui/button";
import { useRouter } from "next/navigation";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";

type DocumentHeaderProps = {
  fileName: string;
  fileStatus?: string;
  onPreview?: () => void;
  onRename?: () => void;
  onSend?: () => void;
  renameDisabled?: boolean;
  sendDisabled?: boolean;
  syncStatus?: {
    syncedCount: number;
    pendingCount: number;
  };
};

const DocumentHeader = ({
  fileName,
  fileStatus,
  onPreview,
  onRename,
  onSend,
  renameDisabled,
  sendDisabled,
  syncStatus,
}: DocumentHeaderProps) => {
  const router = useRouter();

  const isSyncing = syncStatus && syncStatus.pendingCount > 0;

  return (
    <div className="bg-white border-b py-3.5 px-5 border-gray-200 backdrop-blur-sm">
      <div className="flex items-center justify-between">
        {/* Back Button with Animation */}
        <div
          onClick={() => router.push("/dashboard")}
          className="group flex items-center cursor-pointer bg-white gap-2 px-2.5 py-2 rounded-xl hover:bg-gray-100 transition-all duration-300 active:scale-95"
          aria-label="Go back to dashboard"
        >
          <ArrowLeft className="h-5 w-5 text-blue-500 group-hover:text-blue-600 group-hover:-translate-x-1 transition-all duration-300" />
          <span className="text-sm font-medium text-blue-500 group-hover:text-blue-600 transition-colors duration-200">
            Back
          </span>
        </div>

        {/* File Info with Animation */}
        <div className="flex-1 flex items-center justify-center gap-3">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onRename}
              disabled={!onRename || renameDisabled}
              className="hover:underline hover:decoration-gray-400 text-gray-600 cursor-pointer disabled:cursor-not-allowed text-lg font-semibold tracking-tight animate-fade-in bg-transparent border-0 p-0"
            >
              {fileName}
            </button>
            <div className="flex items-center gap-2">
              {fileStatus && (
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    fileStatus.toLowerCase() === "pending"
                      ? "bg-yellow-100 text-yellow-800"
                      : fileStatus.toLowerCase() === "completed"
                        ? "bg-green-100 text-green-800"
                        : "bg-blue-100 text-blue-800"
                  }`}
                >
                  {fileStatus}
                </span>
              )}
              {syncStatus && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        isSyncing
                          ? "bg-blue-100 text-blue-800"
                          : "bg-green-100 text-green-800"
                      }`}
                    >
                      {isSyncing ? (
                        <>
                          <div className="animate-spin rounded-full h-2 w-2 border border-blue-800 border-t-transparent" />
                          Syncing...
                        </>
                      ) : (
                        <>
                          <CloudCheck className="h-3 w-3" />
                          Saved
                        </>
                      )}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>
                      {syncStatus.syncedCount} field
                      {syncStatus.syncedCount !== 1 ? "s" : ""} saved
                      {syncStatus.pendingCount > 0 &&
                        `, ${syncStatus.pendingCount} pending`}
                    </p>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
          </div>
        </div>

        {/* Send Button */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={onPreview}
                    className="bg-[#dcfce6] rounded-xl py-2.5 px-4 cursor-pointer hover:bg-[#befad1] transition-all duration-200"
                  >
                    <LucideEye className="h-4 w-4 font-light text-sm text-green-800 " />
                  </button>
                </TooltipTrigger>
                <TooltipContent className="">
                  <p>Preview</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="bg-[#dbeaff] rounded-xl py-2.5 px-4 cursor-pointer hover:bg-[#bfdbfe] transition-all duration-200">
                  <CloudCheck className="h-4 w-4 font-light text-sm text-blue-800" />
                </div>
              </TooltipTrigger>
              <TooltipContent className="">
                <p>Save as draft</p>
              </TooltipContent>
            </Tooltip>
          </div>

          <Button
            onClick={onSend}
            disabled={sendDisabled}
            className="rounded-xl bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 font-medium shadow-md hover:shadow-lg transition-all duration-200"
          >
            <Send /> Send Document
          </Button>
        </div>
      </div>

      {/* Add CSS animation keyframes */}
      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(-4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.4s ease-out;
        }
      `}</style>
    </div>
  );
};

export default DocumentHeader;
