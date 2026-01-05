// app/documents/[id]/page.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import DocumentHeader from "@/components/documents/DocumentHeader";
import DocumentLeftCol from "@/components/documents/DocumentLeftCol";
import DocumentRightColumn from "@/components/documents/DocumentRightColumn";
import PaginationControls from "@/components/documents/signing/PaginationControls";
import { PDFCanvas } from "@/components/documents/signing/PDFCanvas";
import { SignatureFieldManagerWithSigners } from "@/components/documents/signing/SignatureFieldManager";
import {
  RecipientsProvider,
  useRecipients,
} from "@/components/documents/RecipientsProvider";
import {
  getDocumentMeta,
  getDocumentViewUrl,
} from "@/lib/services/documents/documents";
import { useRenameDocument } from "@/hooks/useRenameDocument";
import { useSignerManagement } from "@/hooks/useSignerManagement";
import { useUser } from "@/hooks/useUser";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PlacedSignature } from "@/components/documents/signing/types";

export default function DocumentViewer() {
  return (
    <RecipientsProvider>
      <DocumentViewerInner />
    </RecipientsProvider>
  );
}

function DocumentViewerInner() {
  const { id: documentId } = useParams() as { id: string };
  const {
    selectedRecipientEmail,
    getRecipientColor,
    recipients,
    setRecipients,
    setHasAddedSelf,
  } = useRecipients();
  const { user } = useUser();

  // Use signer management hook
  const {
    ensureSigner,
    getSignerIdByEmail,
    syncRecipients,
    signers,
    deleteSigner,
  } = useSignerManagement(documentId);

  // Document state
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [meta, setMeta] = useState<any>(null);
  const [numPages, setNumPages] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // UI state
  const [selectedTool, setSelectedTool] = useState<"signature" | null>(null);
  const [fontSize, setFontSize] = useState<number>(16);
  const [selectedSignatureId, setSelectedSignatureId] = useState<string | null>(
    null
  );
  const [renameOpen, setRenameOpen] = useState(false);
  const [renameValue, setRenameValue] = useState("");
  const [hasLoadedFromDb, setHasLoadedFromDb] = useState(false);

  const renameMutation = useRenameDocument();

  // Font utilities
  const clampFont = (size: number) => Math.min(48, Math.max(10, size));

  // Recipient color for new signatures
  const recipientColor = useMemo(
    () =>
      selectedRecipientEmail
        ? getRecipientColor(selectedRecipientEmail)
        : "#000000",
    [selectedRecipientEmail, getRecipientColor]
  );

  // Can place fields only if recipient is selected
  const canPlaceFields = useMemo(
    () => Boolean(selectedRecipientEmail && recipients.length > 0),
    [selectedRecipientEmail, recipients]
  );

  // Load signers from database and populate recipients on mount
  useEffect(() => {
    if (
      recipients.length === 0 &&
      signers.size > 0 &&
      user &&
      !hasLoadedFromDb
    ) {
      // Convert loaded signers to recipients format
      const loadedRecipients = Array.from(signers.values())
        .filter((signer) => signer.signerId) // Only include signers with valid IDs
        .map((signer) => {
          // Check if this signer is the current user
          const isCurrentUser = signer.email === user.email;
          return {
            id: signer.signerId as string, // Use actual signer ID from database (already filtered for valid ID)
            email: signer.email,
            name: signer.name,
            isCurrentUser,
            signingOrder: 1, // Default signing order
          };
        });

      if (loadedRecipients.length > 0) {
        setRecipients(loadedRecipients);
        setHasLoadedFromDb(true);

        // Check if current user is in the loaded signers
        const currentUserInSigners = loadedRecipients.some(
          (r) => r.email === user.email
        );
        if (currentUserInSigners) {
          setHasAddedSelf(true);
        }
      }
    }
  }, [
    signers,
    recipients.length,
    setRecipients,
    user,
    setHasAddedSelf,
    hasLoadedFromDb,
  ]);

  // Get current user's signer ID for removal
  const currentUserSignerId = useMemo(() => {
    if (!user) return undefined;

    // First, try to find in recipients (already loaded)
    const currentUserRecipient = recipients.find((r) => r.email === user.email);
    if (currentUserRecipient) {
      return currentUserRecipient.id;
    }

    // Fall back to looking up in signers Map
    return getSignerIdByEmail(user.email) || undefined;
  }, [user, recipients, getSignerIdByEmail]);

  const signerMappings = useMemo(() => {
    return recipients
      .map((r) => {
        const signerId = getSignerIdByEmail(r.email);
        return {
          email: r.email,
          signerId: signerId || "", // Empty if not created yet
          name: r.name || r.email,
          recipientId: r.id,
        };
      })
      .filter((s) => s.signerId); // Only include signers that have been created
  }, [recipients, getSignerIdByEmail]);

  // Validate email format
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  };

  // Debounced sync - waits 3 seconds after changes stop before syncing to DB
  useEffect(() => {
    const debounceTimer = setTimeout(async () => {
      if (recipients.length === 0) return;

      // Only sync recipients that have both email and name filled in AND valid email
      // AND don't already have a signer ID in the database
      const completedRecipients = recipients.filter((r) => {
        const hasValidEmail =
          r.email &&
          r.email.trim() &&
          r.name &&
          r.name.trim() &&
          isValidEmail(r.email);

        // Skip if already has a signer ID (already synced)
        const signerId = getSignerIdByEmail(r.email);
        return hasValidEmail && !signerId;
      });

      if (completedRecipients.length === 0) return;

      try {
        // Final validation before syncing - ensure all recipients still have valid email/name
        const validRecipientsToSync = completedRecipients.filter((r) => {
          const isValid =
            r.email?.trim() && r.name?.trim() && isValidEmail(r.email);

          if (!isValid) {
            console.warn(
              `Skipping incomplete recipient: ${r.email || "no-email"}`
            );
          }

          return isValid;
        });

        if (validRecipientsToSync.length === 0) return;

        await syncRecipients(
          validRecipientsToSync.map((r) => ({
            id: r.id,
            email: r.email,
            name: r.name || r.email,
            signingOrder: r.signingOrder,
          }))
        );
      } catch (err) {
        console.error("Failed to sync recipients:", err);
      }
    }, 3000); // Wait 3 seconds after changes stop

    // Clean up timer if recipients change again before the delay completes
    return () => clearTimeout(debounceTimer);
  }, [
    recipients,
    syncRecipients,
    isValidEmail,
    getSignerIdByEmail,
    hasLoadedFromDb,
  ]);

  // Load document metadata and URL
  useEffect(() => {
    async function loadDocument() {
      try {
        const [metaRes, urlRes] = await Promise.all([
          getDocumentMeta(documentId),
          getDocumentViewUrl(documentId),
        ]);

        setMeta(metaRes);
        setPdfUrl(urlRes.viewUrl);
      } catch (err: any) {
        setError(err.message || "Failed to load document");
      } finally {
        setLoading(false);
      }
    }

    loadDocument();
  }, [documentId]);

  // Initialize rename value
  useEffect(() => {
    if (meta?.fileName) {
      setRenameValue(meta.fileName);
    }
  }, [meta?.fileName]);

  // Set up PDF.js worker
  useEffect(() => {
    if (typeof window !== "undefined") {
      import("react-pdf").then((reactPdf) => {
        reactPdf.pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${reactPdf.pdfjs.version}/build/pdf.worker.min.mjs`;
      });
    }
  }, []);

  // Handlers
  const handleFontSizeChange = (size: number) => {
    const clamped = clampFont(size);
    setFontSize(clamped);
  };

  const handleSelectSignature = (id: string) => {
    setSelectedSignatureId(id);
    setSelectedTool("signature");
  };

  const handleClearSelection = () => {
    setSelectedSignatureId(null);
    setSelectedTool(null);
  };

  const handleOpenRename = () => {
    setRenameValue(meta?.fileName || "");
    setRenameOpen(true);
  };

  const handleConfirmRename = () => {
    const trimmed = renameValue.trim();
    if (!trimmed || !documentId) return;

    renameMutation.mutate(
      { documentId, newFileName: trimmed },
      {
        onSuccess: () => {
          setMeta((prev: any) =>
            prev ? { ...prev, fileName: trimmed } : prev
          );
          setRenameOpen(false);
        },
      }
    );
  };

  const handlePreview = () => {
    // TODO: Implement preview with actual signed fields
    const payload = {
      documentId,
      currentPage,
      numPages,
      pdfUrl,
      meta,
    };
    if (typeof window !== "undefined") {
      localStorage.setItem("previewData", JSON.stringify(payload));
      window.open(
        `/documents/${documentId}/preview`,
        "_blank",
        "noopener,noreferrer"
      );
    }
  };

  // Loading and error states
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-gray-500">Loading document...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  if (!pdfUrl) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-gray-500">Could not load document.</div>
      </div>
    );
  }

  return (
    <SignatureFieldManagerWithSigners
      documentId={documentId}
      signerMappings={signerMappings}
      numPages={numPages}
    >
      {({
        signatures,
        createSignature,
        updateSignature,
        deleteSignature,
        duplicateSignature,
        copySignatureToAllPages,
        updateSignatureFontSize,
        removeSignaturesByEmail,
        syncStatus,
      }) => {
        // Enhanced createSignature that ensures signer exists first
        const createSignatureWithSigner = async (
          sig: Omit<PlacedSignature, "id">
        ) => {
          // Ensure signer exists for this email
          const signer = recipients.find((r) => r.email === sig.email);
          if (!signer) {
            throw new Error("No signer found for email: " + sig.email);
          }

          // Wait for signer to be created in database
          const signerId = await ensureSigner({
            id: signer.id,
            email: signer.email,
            name: signer.name || signer.email,
            signingOrder: signer.signingOrder,
          });

          if (!signerId) {
            throw new Error("Failed to create signer in database");
          }

          // Now create the signature field with the signer ID
          const fullSignature: PlacedSignature = {
            ...(sig as PlacedSignature),
            id: `sig-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          };

          return createSignature(fullSignature);
        };

        // Sync font size when selecting a signature
        const handleSignatureSelect = (id: string) => {
          const sig = signatures.find((s) => s.id === id);
          if (sig) {
            setFontSize(sig.fontSize);
          }
          handleSelectSignature(id);
        };

        // Update font size for selected signature
        const handleFontSizeChangeWithSync = (size: number) => {
          const clamped = clampFont(size);
          setFontSize(clamped);

          if (selectedSignatureId) {
            updateSignatureFontSize(selectedSignatureId, clamped);
          }
        };

        // Remove signatures when recipient is removed
        useEffect(() => {
          const activeEmails = new Set(
            recipients.map((r) => r.email).filter(Boolean)
          );
          signatures.forEach((sig) => {
            if (!activeEmails.has(sig.email)) {
              removeSignaturesByEmail(sig.email);
            }
          });
        }, [recipients, signatures, removeSignaturesByEmail]);

        // Clear selection if signature was deleted
        useEffect(() => {
          if (
            selectedSignatureId &&
            !signatures.find((s) => s.id === selectedSignatureId)
          ) {
            handleClearSelection();
          }
        }, [signatures, selectedSignatureId]);

        return (
          <div className="flex flex-col h-screen bg-gray-100">
            {/* Header */}
            <DocumentHeader
              fileName={meta?.fileName || "Untitled"}
              onRename={handleOpenRename}
              onPreview={handlePreview}
              syncStatus={syncStatus}
            />

            {/* Main Content */}
            <div className="flex-1 min-h-0 overflow-hidden">
              <div className="w-full h-full grid grid-cols-[20%_55%_25%]">
                {/* Left Column - Tools */}
                <DocumentLeftCol
                  selectedTool={selectedTool}
                  onSelectTool={(tool) => setSelectedTool(tool)}
                  fontSize={fontSize}
                  onChangeFontSize={handleFontSizeChangeWithSync}
                  hasSelectedSignature={Boolean(selectedSignatureId)}
                />

                {/* Center Column - PDF Viewer */}
                <div
                  className="h-full overflow-y-auto flex flex-col items-center p-3 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] relative"
                  onClick={handleClearSelection}
                >
                  <div className="w-full max-w-4xl">
                    <div className="relative">
                      {/* Pagination */}
                      <div className="mb-3">
                        <PaginationControls
                          currentPage={currentPage}
                          numPages={numPages || 1}
                          onPrev={() =>
                            setCurrentPage((p) => Math.max(1, p - 1))
                          }
                          onNext={() =>
                            setCurrentPage((p) =>
                              Math.min(numPages || 1, p + 1)
                            )
                          }
                        />
                      </div>

                      {/* PDF Canvas */}
                      <PDFCanvas
                        pdfUrl={pdfUrl}
                        currentPage={currentPage}
                        numPages={numPages}
                        signatures={signatures}
                        selectedSignatureId={selectedSignatureId}
                        selectedTool={selectedTool}
                        selectedRecipientEmail={selectedRecipientEmail || ""}
                        fontSize={fontSize}
                        recipientColor={recipientColor}
                        onNumPagesLoad={setNumPages}
                        onSelectSignature={handleSignatureSelect}
                        onDeleteSignature={deleteSignature}
                        onDuplicateSignature={duplicateSignature}
                        onCopySignatureToAllPages={copySignatureToAllPages}
                        onUpdateSignature={updateSignature}
                        onCreateSignature={(sig) => {
                          createSignatureWithSigner(sig).catch((err) => {
                            console.error("Failed to create signature:", err);
                            alert("Failed to place signature - " + err.message);
                          });
                        }}
                        onSignatureFontChange={updateSignatureFontSize}
                        onClearSelection={handleClearSelection}
                        canPlaceFields={canPlaceFields}
                      />
                    </div>
                  </div>
                </div>

                {/* Right Column - Recipients */}
                <DocumentRightColumn
                  onRemoveSigner={deleteSigner}
                  currentUserSignerId={currentUserSignerId}
                />
              </div>
            </div>

            {/* Rename Dialog */}
            <Dialog
              open={renameOpen}
              onOpenChange={(open) => {
                setRenameOpen(open);
                if (open) {
                  setRenameValue(meta?.fileName || "");
                }
              }}
            >
              <DialogContent className="bg-white border border-gray-200 shadow-xl fixed! left-1/2! top-1/2! translate-x-[-50%]! translate-y-[-50%]! rounded-3xl p-0 overflow-hidden w-full max-w-lg">
                <div className="px-8 py-6">
                  <h2 className="text-2xl font-bold text-gray-800 mb-6">
                    Rename Document
                  </h2>
                  <Input
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    placeholder="Enter document name"
                    className="w-full mb-6 rounded-xl border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleConfirmRename();
                      }
                    }}
                  />
                  <div className="flex justify-end gap-3">
                    <Button
                      variant="outline"
                      onClick={() => setRenameOpen(false)}
                      className="rounded-xl"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleConfirmRename}
                      disabled={!renameValue.trim() || renameMutation.isPending}
                      className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      {renameMutation.isPending ? "Renaming..." : "Rename"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        );
      }}
    </SignatureFieldManagerWithSigners>
  );
}
