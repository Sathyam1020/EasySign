import { useEffect, useId, useState } from "react";
import { useRouter } from "next/navigation";
import { useRenameDocument } from "@/hooks/useRenameDocument";
import { useDeleteDocument } from "@/hooks/useDeleteDocument";
import {
  Ellipsis,
  PencilIcon,
  TrashIcon,
  File,
  Clock,
  CheckCircle2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
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
  createdAt: string;
  recipients?: Array<{ email: string; name: string }>;
  isSelected?: boolean;
  onSelectToggle?: (id: string, checked: boolean) => void;
};

const canDelete = true; // TODO: implement actual logic

export function DocumentCard({
  id,
  name: initialName,
  theme,
  status,
  createdAt,
  recipients = [],
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

  const handleDelete = () => {
    deleteMutation.mutate(id, {
      onSuccess: () => {
        setDeleteOpen(false);
        toast.success("Document deleted");
      },
      onError: () => {
        toast.error("Failed to delete document");
      },
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const isToday = date.toDateString() === today.toDateString();
    const isYesterday = date.toDateString() === yesterday.toDateString();

    if (isToday) {
      return `Today ${date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      })}`;
    } else if (isYesterday) {
      return `Yesterday ${date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      })}`;
    } else {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year:
          date.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
      });
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const avatarColors = [
    "bg-blue-500",
    "bg-purple-500",
    "bg-pink-500",
    "bg-green-500",
    "bg-orange-500",
    "bg-red-500",
  ];

  const getAvatarColor = (index: number) =>
    avatarColors[index % avatarColors.length];

  return (
    <>
      <div className="group relative rounded-3xl overflow-hidden bg-white w-72 shadow-md hover:shadow-lg transition-all duration-200">
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
        <div className="px-4 py-3 border-t space-y-2">
          {/* Created Date */}
          <div className="text-xs text-gray-400">{formatDate(createdAt)}</div>

          {/* Status and Menu */}
          <div className="flex justify-between items-center gap-1">
            <div
              className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded-full font-medium capitalize whitespace-nowrap ${
                status === "draft"
                  ? "text-yellow-700 bg-yellow-100"
                  : status === "pending"
                  ? "text-blue-900 bg-blue-100"
                  : status === "completed"
                  ? "text-green-900 bg-green-100"
                  : "text-gray-700 bg-gray-100"
              }`}
            >
              {status === "draft" && <File className="h-3 w-3" />}
              {status === "pending" && <Clock className="h-3 w-3" />}
              {status === "completed" && <CheckCircle2 className="h-3 w-3" />}
              {status}
            </div>

            {/* Recipients Avatars - Stack Horizontally */}
            {recipients && recipients.length > 0 && (
              <TooltipProvider>
                <div className="relative flex items-center -space-x-2">
                  {recipients.slice(0, 3).map((recipient, index) => (
                    <Tooltip key={recipient.email}>
                      <TooltipTrigger asChild>
                        <div
                          className={`w-6 h-6 rounded-full  flex items-center justify-center text-white text-xs font-semibold cursor-pointer hover:scale-110 transition-transform border ${getAvatarColor(
                            index
                          )}`}
                          style={{
                            zIndex: recipients.length - index,
                          }}
                        >
                          {getInitials(recipient.name)}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="text-xs">
                        {recipient.name}
                      </TooltipContent>
                    </Tooltip>
                  ))}
                  {recipients.length > 3 && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div
                          className="w-6 h-6 rounded-full flex items-center justify-center text-gray-700 text-xs font-semibold bg-gray-200 cursor-pointer hover:scale-110 transition-transform border border-white"
                          style={{
                            zIndex: 1,
                          }}
                        >
                          +{recipients.length - 3}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="text-xs">
                        {recipients
                          .slice(3)
                          .map((r) => r.name)
                          .join(", ")}
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>
              </TooltipProvider>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="cursor-pointer hover:bg-gray-100 transition-all duration-200 p-1.5 rounded-lg text-gray-400 hover:text-gray-600">
                  <Ellipsis className="text-gray-500 h-4 w-4" />
                </button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-full rounded-xl">
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
                      ? "text-red-600 focus:bg-red-50 focus:text-red-600 hover:bg-red-50 hover:text-red-600 cursor-pointer"
                      : "text-gray-400 cursor-not-allowed"
                  }`}
                >
                  <TrashIcon className="h-4 w-4 hover:text-red-600" />
                  {deleteMutation.isPending ? "Deleting..." : "Delete"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
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
        <DialogContent
          className="rounded-3xl p-0 max-w-md"
          onInteractOutside={(e) => e.preventDefault()}
        >
          <div className="px-6 pt-6 pb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Delete document?
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              This action cannot be undone.
            </p>
          </div>
          <div className="border-t bg-gray-50 px-6 py-3 flex justify-end gap-3 rounded-b-3xl">
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
