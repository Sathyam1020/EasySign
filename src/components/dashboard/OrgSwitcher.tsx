"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

import {
  FolderOpenIcon,
  ChevronDownIcon,
  EllipsisVerticalIcon,
  PencilIcon,
  BarChart3Icon,
  TrashIcon,
  PlusIcon,
  PlusCircleIcon,
} from "lucide-react";

import { countOrgs } from "@/lib/services/organisation/count";
import { switchOrg } from "@/lib/services/organisation/switch";
import { createOrg } from "@/lib/services/organisation/organisation";
import {
  renameActiveOrg,
  deleteActiveOrg,
} from "@/lib/services/organisation/manage";

export function OrgSwitcher() {
  const queryClient = useQueryClient();

  // modal states
  const [openCreate, setOpenCreate] = useState(false);
  const [openRename, setOpenRename] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);

  // form state
  const [name, setName] = useState("");
  const [renameName, setRenameName] = useState("");

  // confirm state
  const [confirmName, setConfirmName] = useState("");

  // fetch orgs + active workspace
  const { data, refetch } = useQuery({
    queryKey: ["orgs"],
    queryFn: countOrgs,
  });

  const activeOrg =
    data?.orgs?.find((o: any) => o.id === data?.activeOrg) ?? data?.orgs?.[0];

  // Pre-fill rename input when modal opens
  useEffect(() => {
    if (openRename && activeOrg) {
      setRenameName(activeOrg.name);
    }
  }, [openRename, activeOrg]);

  // SWITCH
  const switchMutation = useMutation({
    mutationFn: async (orgId: string) => {
      if (!orgId) return; // guard
      return switchOrg(orgId);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["orgs"] });
      await refetch();
    },
  });

  // CREATE
  const createMutation = useMutation({
    mutationFn: createOrg,
    onSuccess: async () => {
      toast.success("Workspace created!");
      setOpenCreate(false);
      setName("");

      await queryClient.invalidateQueries({ queryKey: ["orgs"] });
      await refetch();
    },
  });

  // RENAME
  const renameMutation = useMutation({
    mutationFn: renameActiveOrg,
    onSuccess: async () => {
      toast.success("Workspace renamed");
      setOpenRename(false);
      setRenameName("");
      await queryClient.invalidateQueries({ queryKey: ["orgs"] });
      await refetch();
    },
  });

  // DELETE
  const deleteMutation = useMutation({
    mutationFn: deleteActiveOrg,
    onSuccess: async () => {
      toast.success("Workspace deleted");
      setOpenDelete(false);
      await queryClient.invalidateQueries({ queryKey: ["orgs"] });
      await refetch();
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to delete workspace");
    },
  });

  // Check if we can delete (need at least 2 orgs)
  const canDelete = data?.orgs?.length > 1;

  const normalizedInput = confirmName.trim().toLowerCase();
  const normalizedOrg = (activeOrg?.name ?? "").trim().toLowerCase();

  console.log("Can Delete:", canDelete);
  console.log("confirmName:", confirmName);

  return (
    <>
      {/* ORG SWITCHER */}
      <div className="flex gap-2 items-center">
        <DropdownMenu>
          <DropdownMenuTrigger>
            <div className="px-3 py-2 border border-gray-300 rounded-lg cursor-pointer flex items-center gap-1 shadow-sm hover:bg-gray-50 transition-colors">
              <FolderOpenIcon className="text-gray-600 h-4 w-4" />
              <div className="text-sm font-medium text-black">
                {activeOrg?.name || "Workspace"}
              </div>
              <ChevronDownIcon className="text-gray-600 h-4 w-4" />
            </div>
          </DropdownMenuTrigger>

          <DropdownMenuContent className="w-full rounded-xl">
            {data?.orgs?.map((org: any) => {
              const letter = org.name?.charAt(0).toUpperCase();

              return (
                <DropdownMenuItem
                  key={org.id}
                  onClick={() => switchMutation.mutate(org.id)}
                  className="p-2.5 cursor-pointer text-sm flex items-center gap-3"
                >
                  <div className="h-7 w-7 rounded-full bg-gray-600 text-white flex items-center justify-center font-medium">
                    {letter}
                  </div>

                  <span className="text-gray-700">{org.name}</span>
                </DropdownMenuItem>
              );
            })}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => setOpenCreate(true)}
              className="text-gray-700 p-2.5 cursor-pointer"
            >
              <PlusCircleIcon className="h-4 w-4" />
              Add New Workspace
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* ACTION MENU */}
        <DropdownMenu>
          <DropdownMenuTrigger>
            <div className="cursor-pointer hover:bg-gray-200 transition-all duration-200 p-2 rounded-full">
              <EllipsisVerticalIcon className="text-gray-600 h-4 w-4" />
            </div>
          </DropdownMenuTrigger>

          <DropdownMenuContent className="w-full rounded-xl ">
            <DropdownMenuLabel className="text-xs text-gray-500 p-2.5">
              For this workspace
            </DropdownMenuLabel>
            <DropdownMenuSeparator />

            <DropdownMenuItem
              onClick={() => setOpenRename(true)}
              className="p-2.5 cursor-pointer"
            >
              <PencilIcon className="h-4 w-4 mr-2" />
              Rename
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={() => {
                if (canDelete) {
                  setOpenDelete(true);
                } else {
                  toast.error("Cannot delete your only workspace");
                }
              }}
              disabled={!canDelete}
              className={`${
                canDelete
                  ? "text-red-500 focus:text-red-600 cursor-pointer p-2.5"
                  : "text-gray-400 cursor-not-allowed p-2.5"
              }`}
            >
              <TrashIcon className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* CREATE MODAL */}
      <Dialog open={openCreate} onOpenChange={setOpenCreate}>
        <DialogContent className="flex flex-col gap-4 bg-white border border-gray-200 shadow-xl !fixed !left-[50%] !top-[50%] !translate-x-[-50%] !translate-y-[-50%] z-[9999]">
          <DialogHeader>
            <DialogTitle>Name your workspace</DialogTitle>
          </DialogHeader>

          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Example: HR Team"
            onKeyDown={(e) => {
              if (
                e.key === "Enter" &&
                name.trim() &&
                !createMutation.isPending
              ) {
                createMutation.mutate(name);
              }
            }}
            autoFocus
          />

          <Button
            className="w-full bg-[#ff7f4a] text-white font-semibold border-2 border-black shadow-[3px_3px_0_0_#000] hover:shadow-[5px_5px_0_0_#000] transition-all"
            disabled={!name.trim() || createMutation.isPending}
            onClick={() => createMutation.mutate(name)}
          >
            {createMutation.isPending ? "Creating..." : "Create workspace"}
          </Button>
        </DialogContent>
      </Dialog>

      {/* RENAME MODAL */}
      <Dialog open={openRename} onOpenChange={setOpenRename}>
        <DialogContent className="bg-white border border-gray-200 shadow-xl !fixed !left-1/2 !top-1/2 !translate-x-[-50%] !translate-y-[-50%] rounded-3xl p-0 overflow-hidden w-full max-w-lg">
          {/* Header */}
          <div className="px-6 pt-6 pb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Rename your workspace
            </h2>

            <Input
              value={renameName}
              onChange={(e) => setRenameName(e.target.value)}
              placeholder="Enter new name"
              className="
                mt-5
                h-12
                rounded-xl
                border-2 border-gray-300
                bg-white
                text-gray-900
                focus-visible:ring-0
                focus-visible:border-gray-500
                transition
              "
            />
          </div>

          {/* Footer */}
          <div className="border-t bg-gray-50 px-6 py-3 flex justify-end gap-3">
            <Button
              variant="outline"
              className="rounded-xl border-gray-300 px-5"
              onClick={() => setOpenRename(false)}
              disabled={renameMutation.isPending}
            >
              Cancel
            </Button>

            <Button
              className="rounded-xl bg-gray-700 hover:bg-gray-800 px-6"
              disabled={!renameName.trim() || renameMutation.isPending}
              onClick={() => renameMutation.mutate(renameName)}
            >
              {renameMutation.isPending ? "Renaming..." : "Rename workspace"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* DELETE CONFIRM MODAL */}
      <Dialog open={openDelete} onOpenChange={setOpenDelete}>
        <DialogContent className="bg-white border border-gray-200 shadow-xl !fixed !left-1/2 !top-1/2 !translate-x-[-50%] !translate-y-[-50%] rounded-3xl p-0 overflow-hidden w-full max-w-lg">
          {/* Header */}
          <div className="px-6 pt-6 pb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Delete workspace?
            </h2>

            <p className="mt-4 text-sm text-gray-600">
              This will permanently delete <b>{activeOrg?.name}</b> and all of
              its documents.
              <span className="text-gray-500 block mt-1">
                This action cannot be undone.
              </span>
            </p>

            <p className="mt-5 text-sm text-gray-700">
              To confirm, type <b>{activeOrg?.name}</b> below:
            </p>

            <Input
              value={confirmName}
              onChange={(e) => setConfirmName(e.target.value)}
              placeholder={activeOrg?.name}
              className="
                mt-3
                h-11
                rounded-xl
                border-2 border-gray-300
                bg-white
                text-gray-900
                focus-visible:ring-0
                focus-visible:border-red-500
                transition
              "
            />
          </div>

          {/* Footer */}
          <div className="border-t bg-gray-50 px-6 py-3 flex justify-end gap-3">
            <Button
              variant="outline"
              className="rounded-xl border-gray-300 px-5"
              onClick={() => setOpenDelete(false)}
              disabled={deleteMutation.isPending}
            >
              Cancel
            </Button>

            <Button
              variant="destructive"
              className="rounded-xl px-6 bg-red-600 hover:bg-red-700"
              disabled={
                deleteMutation.isPending ||
                confirmName.trim().toLowerCase() !==
                  (activeOrg?.name ?? "").trim().toLowerCase()
              }
              onClick={() => deleteMutation.mutate()}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete workspace"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}