"use client";

import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { countOrgs } from "@/lib/services/organisation/count";

import Navbar from "@/components/dashboard/Navbar";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogOverlay,
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

import {
  ChevronDownIcon,
  EllipsisVerticalIcon,
  FolderOpenIcon,
  PlusIcon,
  SearchIcon,
} from "lucide-react";
import { createOrg } from "@/lib/services/organisation/organisation";
import { toast } from "sonner";
import { getDocumentsOfOrg } from "@/lib/services/documents/count";
import DocumentsComponent from "@/components/dashboard/DocumentsComponent";
import { OrgSwitcher } from "@/components/dashboard/OrgSwitcher";

const Page = () => {
  const queryClient = useQueryClient();

  const [orgs, setOrgs] = useState<any[]>([]);
  const [orgName, setOrgName] = useState("");
  const [mounted, setMounted] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [documents, setDocuments] = useState<any[]>([]);

  console.log("Documents:", documents);

  console.log("Orgs:", orgs);

  // fetch orgs (only once)
  const getOrgCount = useMutation({
    mutationFn: countOrgs,
    onSuccess: (data) => setOrgs(data.orgs || []),
  });

  // create new org
  const createOrgMutation = useMutation({
    mutationFn: createOrg,
    mutationKey: ["createOrg"],
    onSuccess: (newOrg) => {
      setOrgs((prev) => [...prev, newOrg]);
      queryClient.invalidateQueries({ queryKey: ["orgs"] });
      toast.success("Workspace created successfully!");
      setOrgName("");
    },
  });

  const getDocuments = useMutation({
    mutationFn: getDocumentsOfOrg,
    mutationKey: ["documents"],
    onSuccess: (data) => setDocuments(data || []),
  });

  useEffect(() => {
    getDocuments.mutateAsync();
  }, []);
  console.log("Documents State:", documents);

  useEffect(() => {
    setMounted(true);
    getOrgCount.mutateAsync().finally(() => setLoaded(true));
  }, []);

  const showOrgModal = loaded && orgs.length === 0 && mounted;

  if (!loaded) {
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
    <div className="relative">
      {/* ONBOARDING MODAL */}
      {mounted && (
        <Dialog open={showOrgModal} modal>
          <DialogContent
            className={`${
              showOrgModal && "backdrop-blur-xl"
            } sm:max-w-md fixed left-[50%] top-[50%] bg-white z-50 translate-x-[-50%] translate-y-[-50%]`}
            onInteractOutside={(e) => e.preventDefault()}
            onEscapeKeyDown={(e) => e.preventDefault()}
          >
            <DialogHeader>
              <DialogTitle className="text-xl font-medium text-black">
                Create your first workspace
              </DialogTitle>
            </DialogHeader>

            <p className="text-sm text-gray-700 mt-1">
              Workspaces help you organize files, teams, and signatures. Let's
              start by naming your first one.
            </p>

            <div className="space-y-3 mt-4">
              <Input
                placeholder="Example: HR Team"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                className="bg-white/20 outline-none border-gray-300 text-black focus:outline-none focus:ring-0 focus:border-blue-500"
              />

              <Button
                className="w-full bg-[#ff7f4a] text-black font-semibold border-2 border-black shadow-[3px_3px_0_0_#000] hover:shadow-[5px_5px_0_0_#000]"
                disabled={!orgName.trim() || createOrgMutation.isPending}
                onClick={() => createOrgMutation.mutate(orgName)}
              >
                {createOrgMutation.isPending
                  ? "Creating..."
                  : "Create workspace"}
              </Button>
            </div>
          </DialogContent>
          <DialogOverlay className="fixed inset-0 bg-black/10 backdrop-blur-sm" />
        </Dialog>
      )}

      {/* DASHBOARD */}
      <div className="bg-[#f9fafb] min-h-screen">
        <div className="border-b border-gray-200">
          <div className="max-w-7xl mx-auto">
            <Navbar />
          </div>
        </div>

        <div className="max-w-7xl mx-auto my-5 mt-8">
          <div className="flex items-center justify-between">
            <div className="flex gap-2 items-center">
              {/* <DropdownMenu>
                <DropdownMenuTrigger>
                  <div className="px-3 py-2 border border-gray-300 rounded-xl cursor-pointer flex items-center gap-1 shadow-sm">
                    <FolderOpenIcon className="text-gray-600 h-4 w-4" />
                    <div className="text-sm font-medium text-black">
                      My Workspace
                    </div>
                    <ChevronDownIcon className="text-gray-600 h-4 w-4" />
                  </div>
                </DropdownMenuTrigger>

                <DropdownMenuContent>
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>Profile</DropdownMenuItem>
                  <DropdownMenuItem>Billing</DropdownMenuItem>
                  <DropdownMenuItem>Team</DropdownMenuItem>
                  <DropdownMenuItem>Subscription</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu> */}
              <OrgSwitcher />
            </div>

            <div className="flex gap-3 items-center">
              <div className="flex items-center border border-gray-300 rounded-lg px-3 py-2 gap-2 max-w-xs">
                <SearchIcon className="h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search your file..."
                  className="flex-1 outline-none text-sm text-gray-700"
                />
              </div>

              <Button className="px-3 py-2 shadow-sm flex gap-2 bg-[#364152]">
                <PlusIcon />
                New File
              </Button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto">
          <DocumentsComponent documents={documents} />
        </div>
      </div>
    </div>
  );
};

export default Page;
