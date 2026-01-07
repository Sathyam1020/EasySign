import React from "react";
import { SigningData } from "@/lib/services/documents/signing";
import Image from "next/image";
import Logo from "../../../public/logos/easysign.png";
import { Download, Ban } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useMutation } from "@tanstack/react-query";
import { getDocumentDownloadUrl } from "@/lib/services/documents/signing";

interface SignHeaderProps {
  signingData: SigningData;
  token: string;
}

const SignHeader = ({ signingData, token }: SignHeaderProps) => {
  console.log(signingData, "signingData in SignHeader");

  const remainingSignatures =
    signingData?.fields?.filter((field) => !field.value).length || 0;
  const totalSignatures = signingData?.fields?.length || 0;

  const downloadMutation = useMutation({
    mutationFn: async () => {
      const downloadUrl = await getDocumentDownloadUrl(token);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = signingData.document.fileName || "document.pdf";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    },
    onError: () => {
      alert("Failed to download document");
    },
  });

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-4 py-3 border-b bg-white shadow-sm gap-4">
      {/* Left: Logo + Document Name */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {/* Logo + Brand */}
        <div className="flex items-center gap-2 shrink-0">
          <Image
            src={Logo}
            alt="EasySign logo"
            width={80}
            height={80}
            // className="w-16 h-16 sm:w-20 sm:h-20"
          />
          <div className="hidden sm:block">
            <span className="text-xl sm:text-2xl font-bold">Easy</span>
            <span className="text-xl sm:text-2xl font-bold text-[#ff7f4a]">
              Signn
            </span>
          </div>
        </div>

        {/* Divider */}
        <div className="h-8 w-px bg-gray-400 hidden sm:block" />

        {/* Document Name */}
        <div className="text-sm sm:text-lg font-semibold text-gray-800 truncate max-w-full">
          {signingData?.document.fileName}
        </div>
      </div>

      {/* Right: Actions + Status */}
      <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Download */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => downloadMutation.mutate()}
                disabled={downloadMutation.isPending}
                className="bg-[#dbeaff] hover:bg-[#bfdbfe] rounded-xl p-3 transition-all duration-200 disabled:opacity-70"
                aria-label="Download document"
              >
                <Download className="h-5 w-5 text-blue-800" />
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Download original document</p>
            </TooltipContent>
          </Tooltip>

          {/* Reject */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                className="bg-[#ffdbdb] hover:bg-[#febfbf] rounded-xl p-3 transition-all duration-200"
                aria-label="Reject document"
              >
                <Ban className="h-5 w-5 text-red-800" />
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Reject document</p>
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Signatures Status */}
        <div className="text-right sm:text-left">
          <div className="text-sm sm:text-base font-medium text-gray-700">
            {remainingSignatures === 0 ? (
              <span className="text-green-600 font-semibold">
                All signatures done!
              </span>
            ) : (
              <span>
                {remainingSignatures} signature{remainingSignatures !== 1 ? "s" : ""}{" "}
                remaining
              </span>
            )}
          </div>
          {totalSignatures > 0 && (
            <div className="text-xs text-gray-500">
              of {totalSignatures} total
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SignHeader;