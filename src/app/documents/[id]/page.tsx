// app/documents/[id]/page.tsx
"use client";

import { useState, useEffect, useMemo, useRef } from "react";
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
import { updateSigner } from "@/lib/services/documents/signers";
import { useRenameDocument } from "@/hooks/useRenameDocument";
import { useSignerManagement } from "@/hooks/useSignerManagement";
import { useUser } from "@/hooks/useUser";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PlacedSignature } from "@/components/documents/signing/types";
import { toast } from "sonner";

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
    setEnableSigningOrder,
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
            signingOrder: signer.signingOrder ?? 0, // Use actual order from database
          };
        });

      if (loadedRecipients.length > 0) {
        setRecipients(loadedRecipients);
        setHasLoadedFromDb(true);

        // Determine if signing order is enabled (any signer has order > 0)
        const hasSigningOrder = loadedRecipients.some(
          (r) => (r.signingOrder ?? 0) > 0
        );
        if (hasSigningOrder) {
          setEnableSigningOrder(true);
        }

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
    setEnableSigningOrder,
    hasLoadedFromDb,
  ]);

  // Helper function to update signer order
  const updateSignerOrder = async (
    docId: string,
    signerId: string,
    updates: { order: number }
  ) => {
    return updateSigner(docId, signerId, updates);
  };

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

  // Track previous recipients to detect what changed
  const prevRecipientsRef = useRef<typeof recipients | null>(null);

  // Detect what changed: order only (500ms) or email/name (1500ms)
  const getDebounceDelay = () => {
    if (!prevRecipientsRef.current) return 500;

    const onlyOrderChanged = recipients.every((r, i) => {
      const prev = prevRecipientsRef.current?.[i];
      if (!prev) return false;
      return r.email === prev.email && r.name === prev.name;
    });

    return onlyOrderChanged ? 500 : 1500;
  };

  // Get only the recipients that changed
  const getChangedExistingRecipients = () => {
    if (!prevRecipientsRef.current) {
      return recipients.filter((r) => {
        const hasValidEmail =
          r.email &&
          r.email.trim() &&
          r.name &&
          r.name.trim() &&
          isValidEmail(r.email);

        const signerId = getSignerIdByEmail(r.email);
        return hasValidEmail && !!signerId;
      });
    }

    return recipients.filter((r) => {
      const hasValidEmail =
        r.email &&
        r.email.trim() &&
        r.name &&
        r.name.trim() &&
        isValidEmail(r.email);

      const signerId = getSignerIdByEmail(r.email);
      if (!hasValidEmail || !signerId) return false;

      // Check if this recipient changed by ID, not by index
      const prevRecipient = prevRecipientsRef.current?.find(
        (p) => p.id === r.id
      );
      if (!prevRecipient) return true;

      return (
        r.email !== prevRecipient.email ||
        r.name !== prevRecipient.name ||
        r.signingOrder !== prevRecipient.signingOrder
      );
    });
  };

  // Debounced sync - different delays based on what changed
  useEffect(() => {
    const debounceDelay = getDebounceDelay();
    const debounceTimer = setTimeout(async () => {
      if (recipients.length === 0) return;

      try {
        // Split recipients into new (no signer ID) and existing (has signer ID)
        const newRecipients = recipients.filter((r) => {
          const hasValidEmail =
            r.email &&
            r.email.trim() &&
            r.name &&
            r.name.trim() &&
            isValidEmail(r.email);

          const signerId = getSignerIdByEmail(r.email);
          return hasValidEmail && !signerId;
        });

        const changedExistingRecipients = getChangedExistingRecipients();

        // Sync new recipients
        if (newRecipients.length > 0) {
          const validNewRecipients = newRecipients.filter((r) => {
            const isValid =
              r.email?.trim() && r.name?.trim() && isValidEmail(r.email);

            if (!isValid) {
              console.warn(
                `Skipping incomplete recipient: ${r.email || "no-email"}`
              );
            }

            return isValid;
          });

          if (validNewRecipients.length > 0) {
            await syncRecipients(
              validNewRecipients.map((r) => ({
                id: r.id,
                email: r.email,
                name: r.name || r.email,
                signingOrder: r.signingOrder,
              }))
            );
          }
        }

        // Update only the changed existing signers
        if (changedExistingRecipients.length > 0) {
          for (const recipient of changedExistingRecipients) {
            const signerId = getSignerIdByEmail(recipient.email);
            if (signerId) {
              try {
                await updateSignerOrder(documentId, signerId, {
                  order: recipient.signingOrder ?? 0,
                });
              } catch (error) {
                console.error(
                  `Failed to update signer order for ${recipient.email}:`,
                  error
                );
              }
            }
          }
        }
      } catch (err) {
        console.error("Failed to sync recipients:", err);
      }
    }, debounceDelay); // Wait 500ms for order changes, 1500ms for email/name changes

    // Clean up timer if recipients change again before the delay completes
    return () => {
      clearTimeout(debounceTimer);
      prevRecipientsRef.current = recipients;
    };
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
          toast.success("Document renamed successfully");
          setRenameOpen(false);
        },
        onError: (error: any) => {
          toast.error(error?.message || "Failed to rename document");
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
        <div className="flex flex-col items-center gap-3 text-gray-700">
          <div className="h-12 w-12 border-4 border-gray-200 border-t-[#ff7f4a] rounded-full animate-spin" />
          <div className="text-base font-semibold">Loading document…</div>
        </div>
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
          <div className="flex flex-col h-screen bg-white">
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