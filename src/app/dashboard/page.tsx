"use client";

import { useState, useEffect, useMemo, useRef, useLayoutEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import Navbar from "@/components/dashboard/Navbar";
import DocumentsComponent from "@/components/dashboard/DocumentsComponent";
import { OrgSwitcher } from "@/components/dashboard/OrgSwitcher";
import { UploadDocumentModal } from "@/components/dashboard/UploadDocument";

import { countOrgs } from "@/lib/services/organisation/count";
import { getDocumentsOfOrg } from "@/lib/services/documents/count";
import { moveDocuments } from "@/lib/services/documents/documents";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { toast } from "sonner";
import { createOrg } from "@/lib/services/organisation/organisation";
import { Plus } from "lucide-react";

type Org = { id: string; name: string };

export default function Page() {
  const [orgName, setOrgName] = useState("");
  const [mounted, setMounted] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [creatingOrg, setCreatingOrg] = useState(false);
  const [moveModalOpen, setMoveModalOpen] = useState(false);
  const [targetOrgId, setTargetOrgId] = useState("");
  const [selectedDocumentIds, setSelectedDocumentIds] = useState<string[]>([]);
  const moveTriggerRef = useRef<HTMLButtonElement | null>(null);
  const [moveTriggerWidth, setMoveTriggerWidth] = useState<number>(0);

  const queryClient = useQueryClient();

  useEffect(() => setMounted(true), []);

  // 1️⃣ FETCH ORGS + ACTIVE ORG
  const { data: orgData, isLoading: orgLoading } = useQuery({
    queryKey: ["orgs"],
    queryFn: countOrgs,
  });

  const orgs: Org[] = orgData?.orgs ?? [];
  const activeOrg = orgData?.activeOrg ?? null;

  // 2️⃣ FETCH DOCUMENTS FOR ACTIVE ORG
  const { data: documents = [], isLoading: docsLoading } = useQuery({
    queryKey: ["documents", activeOrg],
    queryFn: getDocumentsOfOrg,
    enabled: !!activeOrg, // only fetch when org is ready
  });

  // Reset selection when workspace changes or data refreshes
  useEffect(() => {
    setSelectedDocumentIds([]);
  }, [activeOrg]);

  const moveTargets = useMemo(
    () => orgs.filter((o) => o.id !== activeOrg),
    [orgs, activeOrg]
  );

  useLayoutEffect(() => {
    if (moveModalOpen && moveTriggerRef.current) {
      setMoveTriggerWidth(moveTriggerRef.current.getBoundingClientRect().width);
    }
  }, [moveModalOpen, moveTargets.length]);

  const moveMutation = useMutation({
    mutationFn: (payload: { targetOrgId: string; documentIds: string[] }) =>
      moveDocuments(payload.documentIds, payload.targetOrgId),
    onSuccess: (_data, variables) => {
      const workspaceName =
        orgs.find((o) => o.id === variables.targetOrgId)?.name || "workspace";
      toast.success(`document moved to workspace: ${workspaceName}`);
      setMoveModalOpen(false);
      setSelectedDocumentIds([]);
      queryClient.invalidateQueries({ queryKey: ["documents", activeOrg] });
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to move documents");
    },
  });

  const toggleSelection = (id: string, checked: boolean) => {
    setSelectedDocumentIds((prev) => {
      if (checked && !prev.includes(id)) return [...prev, id];
      if (!checked) return prev.filter((d) => d !== id);
      return prev;
    });
  };

  // modal state
  const showOrgModal = mounted && !orgLoading && orgs.length === 0;

  async function handleCreateOrg() {
    if (!orgName.trim()) return;

    try {
      setCreatingOrg(true);

      await createOrg(orgName);

      // Refresh org data so modal closes once the first workspace exists
      await queryClient.invalidateQueries({ queryKey: ["orgs"] });

      toast.success("Workspace created");

      setOrgName("");
      setCreatingOrg(false);
    } catch (error: any) {
      toast.error(error?.message || "Failed to create workspace");
      setCreatingOrg(false);
    }
  }

  if (orgLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f9fafb]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-12 w-12 border-5 border-gray-300 border-t-[#ff7f4a] rounded-full animate-spin" />
          <p className="text-black text-3xl font-bold">
            Loading Your Dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative bg-[#f9fafb] min-h-screen">
      {/* ===================== ONBOARDING MODAL ===================== */}
      <Dialog open={showOrgModal} modal>
        <DialogContent
          className="sm:max-w-md rounded-xl fixed left-1/2 top-1/2 translate-x-[-50%] translate-y-[-50%]"
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle className="text-xl font-medium text-black">
              Create your first workspace
            </DialogTitle>
          </DialogHeader>

          <p className="text-sm text-gray-700 mt-1">
            Workspaces help you organize files, teams, and signatures. Name your
            first workspace.
          </p>

          <div className="space-y-3 mt-2">
            <Input
              placeholder="Example: HR Team"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              className="focus:border-blue-500 focus:ring-0 rounded-xl"
            />

            <Button
              className="w-full bg-[#ff7f4a] rounded-xl text-black font-semibold border-2 border-black shadow-[3px_3px_0_0_#000]"
              disabled={!orgName.trim() || creatingOrg}
              onClick={handleCreateOrg}
            >
              {creatingOrg ? "Creating..." : "Create workspace"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ===================== DASHBOARD ===================== */}
      <div className="border-b bg-white">
        <div className="">
          <Navbar />
        </div>
      </div>

      <div className="max-w-7xl mx-auto my-5 mt-8">
        <div className="flex items-center justify-between">
          <OrgSwitcher />

          <div className="flex gap-3 items-center">
            {selectedDocumentIds.length > 0 && (
              <Button
                className="px-4 py-2 rounded-xl bg-[#165dfc] text-white shadow-sm"
                onClick={() => {
                  if (!moveTargets.length) {
                    toast.error("No other workspaces available");
                    return;
                  }
                  setMoveModalOpen(true);
                  setTargetOrgId((prev) => prev || moveTargets[0]?.id || "");
                }}
              >
                <span className="inline-flex items-center gap-2">
                  Move to different workspace
                </span>
              </Button>
            )}

            <div className="flex items-center border border-gray-300 rounded-xl px-3 py-2 gap-2 max-w-xs bg-white">
              <input
                type="text"
                placeholder="Search your file..."
                className="flex-1 outline-none text-sm text-gray-700"
              />
            </div>

            <Button
              className="px-3 py-2 shadow-sm flex gap-2 rounded-xl bg-[#364152]"
              onClick={() => setUploadModalOpen(true)}
            >
              <Plus className="h-4 w-4" /> Add document
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto">
        <DocumentsComponent
          documents={documents}
          isLoading={docsLoading}
          selectedIds={new Set(selectedDocumentIds)}
          onToggleSelect={toggleSelection}
        />
      </div>

      {/* Upload Modal */}
      <UploadDocumentModal
        open={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
      />

      <Dialog
        open={moveModalOpen}
        onOpenChange={(open) => open && setMoveModalOpen(true)}
      >
        <DialogContent
          className="sm:max-w-md rounded-3xl"
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-black">
              Select a Workspace
            </DialogTitle>
          </DialogHeader>

          <div className="mt-3 space-y-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-between rounded-xl border border-gray-300 text-gray-800"
                  ref={moveTriggerRef}
                >
                  {targetOrgId
                    ? moveTargets.find((o) => o.id === targetOrgId)?.name ||
                      "Select workspace"
                    : "Select workspace"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                className="rounded-xl"
                style={
                  moveTriggerWidth ? { width: moveTriggerWidth } : undefined
                }
              >
                <DropdownMenuLabel className="text-xs text-gray-500 p-3">
                  Choose workspace
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {moveTargets.map((org) => (
                  <DropdownMenuItem
                    key={org.id}
                    onClick={() => setTargetOrgId(org.id)}
                    className="text-sm cursor-pointer p-3"
                  >
                    {org.name}
                  </DropdownMenuItem>
                ))}
                {moveTargets.length === 0 && (
                  <DropdownMenuItem disabled>
                    No other workspaces
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button
              variant="outline"
              className="rounded-xl"
              onClick={() => setMoveModalOpen(false)}
              disabled={moveMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              className="rounded-xl bg-[#165dfc] text-white"
              disabled={
                moveMutation.isPending ||
                !targetOrgId ||
                selectedDocumentIds.length === 0
              }
              onClick={() =>
                moveMutation.mutate({
                  documentIds: selectedDocumentIds,
                  targetOrgId,
                })
              }
            >
              {moveMutation.isPending ? "Moving..." : "Move"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
