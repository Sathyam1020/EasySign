import { useEffect, useId, useState } from "react";
import { useRouter } from "next/navigation";
import { useRenameDocument } from "@/hooks/useRenameDocument";
import { useDeleteDocument } from "@/hooks/useDeleteDocument";
import {
  Ellipsis,
  PencilIcon,
  TrashIcon,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Input } from "../ui/input";
import { Dialog, DialogContent } from "../ui/dialog";
import { Button } from "../ui/button";
import { toast } from "sonner";
import { Label } from "../ui/label";
import { CustomCheckbox } from "../CustomCheckbox";

type Props = {
  id: string;
  name: string;
  theme: { base: string; blob: string };
  status: string;
  isSelected?: boolean;
  onSelectToggle?: (id: string, checked: boolean) => void;
};

const canDelete = true; // TODO: implement actual logic

export function DocumentCard({
  id,
  name: initialName,
  theme,
  status,
  isSelected = false,
  onSelectToggle,
}: Props) {
  const router = useRouter();
  const [renameOpen, setRenameOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [displayName, setDisplayName] = useState(initialName);
  const [newName, setNewName] = useState(initialName);
  const checkboxId = useId();

  const renameMutation = useRenameDocument();
  const deleteMutation = useDeleteDocument();

  useEffect(() => {
    setDisplayName(initialName);
    setNewName(initialName);
  }, [initialName]);

  const handleDialogToggle = (open: boolean) => {
    setRenameOpen(open);
    if (!open) setNewName(displayName);
  };

  const handleRename = () => {
    const trimmed = newName.trim();

    if (!trimmed || trimmed === displayName) {
      handleDialogToggle(false);
      return;
    }

    renameMutation.mutate(
      { documentId: id, newFileName: trimmed },
      {
        onSuccess: () => {
          setDisplayName(trimmed);
          setRenameOpen(false);
          toast.success("Document renamed");
        },
        onError: () => {
          setNewName(displayName);
          toast.error("Failed to rename");
        },
      }
    );
  };

  return (
    <>
      <div className="group relative rounded-2xl overflow-hidden bg-white w-72 shadow-md hover:shadow-lg transition-all duration-200">
        {/* Custom Selection Checkbox - appears on hover or when selected */}
        <div
          onClick={(e) => e.stopPropagation()}
          className={`absolute left-4 top-4 z-20 transition-opacity ${
            isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
          }`}
        >
          <CustomCheckbox
            id={checkboxId}
            checked={isSelected}
            onCheckedChange={(checked) => onSelectToggle?.(id, !!checked)}
          />
          <Label htmlFor={checkboxId} className="sr-only">
            Select document
          </Label>
        </div>

        {/* Thumbnail */}
        <div
          className="relative p-2 h-40 flex items-center justify-center cursor-pointer text-lg font-medium overflow-hidden"
          style={{ backgroundColor: theme.base }}
          onClick={() => router.push(`/documents/${id}`)}
        >
          <span className="relative z-10 text-2xl font-light text-gray-900 drop-shadow-sm">
            {displayName}
          </span>

          <svg
            viewBox="0 0 200 200"
            className="absolute inset-0 h-full w-full pointer-events-none"
            preserveAspectRatio="none"
          >
            <path
              d="M140 0 C155 40 155 80 140 120 C125 160 125 200 140 200 L200 200 L200 0 Z"
              fill={theme.blob}
            />
          </svg>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center px-4 py-4">
          <div className="text-xs text-yellow-700 bg-yellow-100 px-2 py-1 rounded-full font-medium">
            {status}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="cursor-pointer hover:bg-gray-100 transition-all duration-200 p-2 rounded-full">
                <Ellipsis className="text-gray-600 h-4 w-4" />
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-48 rounded-xl">
              <DropdownMenuLabel className="text-xs text-gray-500 p-2.5">
                Actions
              </DropdownMenuLabel>
              <DropdownMenuSeparator />

              <DropdownMenuItem
                onClick={() => setRenameOpen(true)}
                className="p-2.5 cursor-pointer flex items-center gap-2"
              >
                <PencilIcon className="h-4 w-4" />
                Rename
              </DropdownMenuItem>

              <DropdownMenuItem
                disabled={!canDelete || deleteMutation.isPending}
                onClick={() => canDelete && setDeleteOpen(true)}
                className={`p-2.5 flex items-center gap-2 ${
                  canDelete
                    ? "text-red-600 hover:bg-red-50 cursor-pointer"
                    : "text-gray-400 cursor-not-allowed"
                }`}
              >
                <TrashIcon className="h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Loading overlay during rename */}
        {renameMutation.isPending && (
          <div className="absolute inset-0 bg-white/70 flex items-center justify-center rounded-2xl z-30">
            <span className="text-sm text-gray-600">Renaming...</span>
          </div>
        )}
      </div>

      {/* Rename Dialog */}
      <Dialog open={renameOpen} onOpenChange={handleDialogToggle}>
        <DialogContent className="rounded-3xl p-0 max-w-md">
          <div className="px-6 pt-6 pb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Rename document
            </h2>
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleRename();
                if (e.key === "Escape") handleDialogToggle(false);
              }}
              placeholder="Enter new name"
              autoFocus
              className="mt-4 h-12 rounded-xl border-2"
            />
          </div>
          <div className="border-t bg-gray-50 px-6 py-3 flex justify-end gap-3">
            <Button variant="outline" onClick={() => handleDialogToggle(false)}>
              Cancel
            </Button>
            <Button onClick={handleRename} disabled={renameMutation.isPending}>
              {renameMutation.isPending ? "Renaming..." : "Rename"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="rounded-3xl p-0 max-w-md">
          <div className="px-6 pt-6 pb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Delete document?
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              This action cannot be undone.
            </p>
          </div>
          <div className="border-t bg-gray-50 px-6 py-3 flex justify-end gap-3">
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() =>
                deleteMutation.mutate(id, {
                  onSuccess: () => {
                    setDeleteOpen(false);
                    toast.success("Document deleted");
                  },
                })
              }
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}