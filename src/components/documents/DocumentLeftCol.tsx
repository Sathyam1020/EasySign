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
    () => recipients.filter((r) => r.email && r.name).map((r) => r.email),
    [recipients]
  );
  const disableFields = emails.length === 0;

  const FONT_MIN = 10;
  const FONT_MAX = 48;
  const sliderFill = ((fontSize - FONT_MIN) / (FONT_MAX - FONT_MIN)) * 100;

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
            <PenIcon className="h-4 w-4 text-black font-semibold text-sm" />{" "}
            <span
              style={{
                fontFamily:
                  '"Pacifico", "Dancing Script", "Segoe Script", cursive',
                fontWeight: 600,
                letterSpacing: "0.02em",
              }}
            >
              Signature
            </span>
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
          <div className="flex items-center gap-3">
            <button
              className="h-6 w-8 rounded-lg border border-gray-300 bg-white text-gray-700 text-sm font-semibold shadow-sm hover:bg-gray-100 transition-colors"
              onClick={() => onChangeFontSize(Math.max(FONT_MIN, fontSize - 1))}
              aria-label="Decrease font size"
            >
              -
            </button>
            <input
              type="range"
              min={FONT_MIN}
              max={FONT_MAX}
              step={1}
              value={fontSize}
              onChange={(e) => onChangeFontSize(Number(e.target.value))}
              className="w-full h-2 rounded-full appearance-none outline-none"
              style={{
                background: `linear-gradient(to right, #111827 0%, #111827 ${sliderFill}%, #e5e7eb ${sliderFill}%, #e5e7eb 100%)`,
              }}
            />
            <button
              className="h-6 w-8 rounded-lg border border-gray-300 bg-white text-gray-700 text-sm font-semibold shadow-sm hover:bg-gray-100 transition-colors"
              onClick={() => onChangeFontSize(Math.min(FONT_MAX, fontSize + 1))}
              aria-label="Increase font size"
            >
              +
            </button>
          </div>
          <div className="flex justify-between text-[11px] text-gray-500">
            <span>{FONT_MIN}px</span>
            <span>Readable</span>
            <span>{FONT_MAX}px</span>
          </div>
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
