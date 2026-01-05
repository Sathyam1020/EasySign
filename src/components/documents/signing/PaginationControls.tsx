import React from "react";
import { Button } from "@/components/ui/button";

type Props = {
  currentPage: number;
  numPages: number;
  onPrev: () => void;
  onNext: () => void;
};

const PaginationControls = ({
  currentPage,
  numPages,
  onPrev,
  onNext,
}: Props) => {
  if (numPages <= 1) return null;

  return (
    <div className="rounded-xl flex items-center justify-center gap-3 px-3 py-2 bg-[#f3f4f6] sticky top-0 z-10 mb-4">
      <Button
        onClick={onPrev}
        disabled={currentPage === 1}
        className="px-3 py-1.5 rounded-lg border border-gray-300 text-xs font-semibold text-gray-600 bg-white hover:bg-gray-100 disabled:opacity-50"
      >
        Previous
      </Button>

      <span className="text-xs text-gray-600 font-semibold">
        Page {currentPage} of {numPages}
      </span>

      <Button
        onClick={onNext}
        disabled={currentPage === numPages}
        className="px-3 py-1.5 rounded-lg border border-gray-300 text-xs font-semibold text-gray-600 bg-white hover:bg-gray-100 disabled:opacity-50"
      >
        Next
      </Button>
    </div>
  );
};

export default PaginationControls;
