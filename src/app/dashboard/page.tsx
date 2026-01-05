"use client";

import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import Navbar from "@/components/dashboard/Navbar";
import DocumentsComponent from "@/components/dashboard/DocumentsComponent";
import { OrgSwitcher } from "@/components/dashboard/OrgSwitcher";
import { UploadDocumentModal } from "@/components/dashboard/UploadDocument";

import { countOrgs } from "@/lib/services/organisation/count";
import { getDocumentsOfOrg } from "@/lib/services/documents/count";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import { toast } from "sonner";
import { createOrg } from "@/lib/services/organisation/organisation";
import { Plus } from "lucide-react";

export default function Page() {
  const [orgName, setOrgName] = useState("");
  const [mounted, setMounted] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [creatingOrg, setCreatingOrg] = useState(false);

  const queryClient = useQueryClient();

  useEffect(() => setMounted(true), []);

  // 1️⃣ FETCH ORGS + ACTIVE ORG
  const { data: orgData, isLoading: orgLoading } = useQuery({
    queryKey: ["orgs"],
    queryFn: countOrgs,
  });

  const orgs = orgData?.orgs ?? [];
  const activeOrg = orgData?.activeOrg ?? null;

  // 2️⃣ FETCH DOCUMENTS FOR ACTIVE ORG
  const { data: documents = [], isLoading: docsLoading } = useQuery({
    queryKey: ["documents", activeOrg],
    queryFn: getDocumentsOfOrg,
    enabled: !!activeOrg, // only fetch when org is ready
  });

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
             <Plus className="h-4 w-4"/> New File
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto">
        <DocumentsComponent documents={documents} isLoading={docsLoading} />
      </div>

      {/* Upload Modal */}
      <UploadDocumentModal
        open={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
      />
    </div>
  );
}
