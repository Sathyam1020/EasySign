"use client";

import {
  ArrowLeft,
  CloudCheck,
  Play,
  RocketIcon,
  SaveIcon,
  VideoIcon,
} from "lucide-react";
import React from "react";
import { Button } from "../ui/button";
import { useRouter } from "next/navigation";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";

type DocumentHeaderProps = {
  fileName: string;
  fileStatus: string;
};

const DocumentHeader = ({ fileName, fileStatus }: DocumentHeaderProps) => {
  const router = useRouter();

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
            <div className="hover:underline hover:decoration-gray-400 text-gray-600 cursor-pointer text-lg font-semibold tracking-tight animate-fade-in">
              {fileName}
            </div>
            <div className="flex items-center gap-2">
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
            </div>
          </div>
        </div>

        {/* Send Button */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="bg-[#dcfce6] rounded-xl py-2.5 px-4 cursor-pointer hover:bg-[#befad1] transition-all duration-200">
                    <Play className="h-4 w-4 font-light text-sm text-green-800 " />
                  </div>
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
            disabled={true}
            className="rounded-xl bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 font-medium shadow-md hover:shadow-lg transition-all duration-200"
          >
            Send File
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
