"use client";

import React, { useMemo, useState } from "react";
import { useRecipients } from "./RecipientsProvider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Button } from "../ui/button";
import { ChevronDownIcon, MailIcon, PenIcon } from "lucide-react";

type Props = {
  selectedTool: "signature" | null;
  onSelectTool: (tool: "signature") => void;
  fontSize: number;
  onChangeFontSize: (size: number) => void;
  hasSelectedSignature: boolean;
};

const DocumentLeftCol = ({
  selectedTool,
  onSelectTool,
  fontSize,
  onChangeFontSize,
  hasSelectedSignature,
}: Props) => {
  const {
    recipients,
    selectedRecipientEmail,
    setSelectedRecipientEmail,
    getRecipientColor,
  } = useRecipients();
  const emails = useMemo(
    () => recipients.map((r) => r.email).filter(Boolean),
    [recipients]
  );
  const disableFields = emails.length === 0;

  return (
    <div className="bg-[#f3f4f6] h-full overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
      <div className="flex flex-col gap-3 p-4 border-b ">
        <div>
          <p className="text-sm font-semibold text-gray-700">
            Selected Recipient
          </p>
          <p className="text-xs text-gray-500">
            Choose an email from recipients
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-between rounded-xl border-gray-300 bg-gray-50 text-gray-700 hover:bg-gray-100"
              disabled={emails.length === 0}
            >
              <span className="flex items-center gap-2 text-sm">
                <MailIcon className="h-4 w-4 text-gray-500" />
                {selectedRecipientEmail || (emails[0] ?? "No recipients")}
              </span>
              <ChevronDownIcon className="h-4 w-4 text-gray-500" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-full rounded-xl ">
            <DropdownMenuLabel className="text-xs text-gray-500 p-2.5">
              Signers
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {emails.length === 0 ? (
              <DropdownMenuItem className="text-sm text-gray-500" disabled>
                No recipients yet
              </DropdownMenuItem>
            ) : (
              emails.map((email) => {
                const letter = email?.charAt(0).toUpperCase();
                const color = getRecipientColor(email);
                return (
                  <DropdownMenuItem
                    key={email}
                    className="p-2.5 cursor-pointer text-sm flex items-center gap-3"
                    onSelect={() => setSelectedRecipientEmail(email)}
                  >
                    <span
                      className="h-7 w-7 rounded-full text-white flex items-center justify-center font-medium"
                      style={{ backgroundColor: color }}
                    >
                      {letter}
                    </span>
                    <span className="text-gray-700">{email}</span>
                  </DropdownMenuItem>
                );
              })
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {/* Add Fields */}
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-gray-800">Add fields</p>
          <span className="text-[11px] text-gray-500">Drag to place</span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            className={`justify-center border-dashed border-black bg-[#fda5d5] transition-all duration-200 hover:bg-[#fa98ce] text-black font-semibold text-sm ${
              selectedTool === "signature"
                ? "ring-2 ring-offset-1 ring-gray-300"
                : ""
            }`}
            draggable
            onDragStart={(e) => {
              if (disableFields) return;
              e.dataTransfer.setData("text/plain", "signature");
              onSelectTool("signature");
            }}
            onClick={() => {
              if (disableFields) return;
              onSelectTool("signature");
            }}
            disabled={disableFields}
          >
            <PenIcon className="h-4 w-4 text-black font-semibold text-sm" /> Signature
          </Button>
        </div>
      </div>

      {/* Appearance controls */}
      <div className="p-4 space-y-3 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-gray-800">Appearance</p>
          <span className="text-[11px] text-gray-500">Signature</span>
        </div>
        <div
          className={`space-y-2 transition-all duration-200 ease-out ${
            hasSelectedSignature
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-1 pointer-events-none"
          }`}
          aria-hidden={!hasSelectedSignature}
        >
          <div className="flex items-center justify-between text-xs text-gray-600">
            <span>Font size</span>
            <span className="font-semibold text-gray-800">{fontSize}px</span>
          </div>
          <input
            type="range"
            min={10}
            max={48}
            step={1}
            value={fontSize}
            onChange={(e) => onChangeFontSize(Number(e.target.value))}
            className="w-full accent-gray-700"
          />
        </div>

        {!hasSelectedSignature && (
          <p className="text-xs text-gray-500">
            Click a signature to edit appearance
          </p>
        )}
      </div>
    </div>
  );
};

export default DocumentLeftCol;
