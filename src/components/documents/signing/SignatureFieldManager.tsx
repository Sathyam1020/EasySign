// components/documents/signing/SignatureFieldManager.tsx
"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { PlacedSignature } from "./types";
import { useSignatureFieldSync } from "@/hooks/useSignatureFieldSync";
import { useSignatureOperations } from "@/hooks/useSignatureOperations";

interface SignatureFieldManagerProps {
  documentId: string;
  children: (props: SignatureFieldManagerRenderProps) => React.ReactNode;
}

export interface SignatureFieldManagerRenderProps {
  signatures: PlacedSignature[];
  createSignature: (signature: PlacedSignature) => Promise<string>;
  updateSignature: (
    id: string,
    updates: Partial<PlacedSignature>
  ) => Promise<void>;
  deleteSignature: (id: string) => Promise<void>;
  duplicateSignature: (id: string) => Promise<string | null>;
  copySignatureToAllPages: (id: string) => Promise<string[] | undefined>;
  updateSignatureFontSize: (id: string, fontSize: number) => Promise<void>;
  removeSignaturesByEmail: (email: string) => void;
  isFieldPending: (fieldId: string) => boolean;
  syncStatus: {
    syncedCount: number;
    pendingCount: number;
  };
  loadFields: () => Promise<void>;
}

interface SignerMapping {
  email: string;
  signerId: string;
  name: string;
}

interface SignatureFieldManagerWithSignersProps
  extends SignatureFieldManagerProps {
  signerMappings: SignerMapping[];
  numPages: number | null;
}

/**
 * SignatureFieldManager
 *
 * Manages signature field state and synchronization with the database.
 * Handles race conditions by using optimistic updates and request queuing.
 *
 * Usage:
 * <SignatureFieldManager documentId={id} signerMappings={signers} numPages={pages}>
 *   {({ signatures, createSignature, updateSignature, ... }) => (
 *     <YourUIComponents />
 *   )}
 * </SignatureFieldManager>
 */
export function SignatureFieldManagerWithSigners({
  documentId,
  signerMappings,
  numPages,
  children,
}: SignatureFieldManagerWithSignersProps) {
  const [signatures, setSignatures] = useState<PlacedSignature[]>([]);
  const [isInitialLoadComplete, setIsInitialLoadComplete] = useState(false);

  // Initialize sync hook for database operations
  const {
    generateFieldId,
    createField: syncCreateField,
    updateField: syncUpdateField,
    deleteField: syncDeleteField,
    loadFields: loadFieldsFromDb,
    isPending,
    getSyncedCount,
    getPendingCount,
  } = useSignatureFieldSync(documentId);

  // Helper to get signer ID by email
  const getSignerIdForEmail = useCallback(
    (email: string): string | null => {
      const signer = signerMappings.find((s) => s.email === email);
      return signer?.signerId || null;
    },
    [signerMappings]
  );

  // Wrapper for sync create that matches expected signature
  const handleSyncCreate = useCallback(
    async (field: PlacedSignature, signerId: string) => {
      await syncCreateField(field, signerId);
    },
    [syncCreateField]
  );

  // Wrapper for sync update
  const handleSyncUpdate = useCallback(
    async (field: PlacedSignature) => {
      await syncUpdateField(field);
    },
    [syncUpdateField]
  );

  // Wrapper for sync delete
  const handleSyncDelete = useCallback(
    async (fieldId: string) => {
      await syncDeleteField(fieldId);
    },
    [syncDeleteField]
  );

  // Initialize operations hook
  const {
    createSignature: createSig,
    updateSignature: updateSig,
    deleteSignature: deleteSig,
    duplicateSignature,
    copySignatureToAllPages,
    updateSignatureFontSize,
    removeSignaturesByEmail,
  } = useSignatureOperations({
    signatures,
    setSignatures,
    numPages,
    onSyncCreate: handleSyncCreate,
    onSyncUpdate: handleSyncUpdate,
    onSyncDelete: handleSyncDelete,
    getSignerIdForEmail,
  });

  // Load existing fields from database on mount
  const loadFields = useCallback(async () => {
    try {
      const fields = await loadFieldsFromDb();

      // Map database fields to PlacedSignature format
      const mappedFields: PlacedSignature[] = fields.map((field: any) => ({
        id: field.id,
        email: field.signer?.email || "",
        x: field.xPosition,
        y: field.yPosition,
        width: field.width,
        height: field.height,
        page: field.pageNumber,
        fontSize: field.fontSize,
        fontFamily: field.fontFamily,
        color: field.color,
        alignment: field.alignment as "left" | "center" | "right",
        fieldType: field.fieldType as PlacedSignature["fieldType"],
        required: field.required,
        placeholder: field.placeholder,
        value: field.value,
        signedAt: field.signedAt ? new Date(field.signedAt) : null,
      }));

      setSignatures(mappedFields);
      setIsInitialLoadComplete(true);
    } catch (error) {
      console.error("Failed to load signature fields:", error);
      setIsInitialLoadComplete(true);
    }
  }, [loadFieldsFromDb]);

  // Load fields on mount
  useEffect(() => {
    loadFields();
  }, [loadFields]);

  // Enhanced create signature with ID generation
  const createSignature = useCallback(
    async (signatureData: Omit<PlacedSignature, "id"> & { id?: string }) => {
      const fieldId = signatureData.id || generateFieldId();
      const signature: PlacedSignature = {
        ...signatureData,
        id: fieldId,
      } as PlacedSignature;

      return await createSig(signature);
    },
    [createSig, generateFieldId]
  );

  // Sync status
  const syncStatus = useMemo(
    () => ({
      syncedCount: getSyncedCount(),
      pendingCount: getPendingCount(),
    }),
    [getSyncedCount, getPendingCount]
  );

  // Render props pattern
  return (
    <>
      {children({
        signatures,
        createSignature,
        updateSignature: updateSig,
        deleteSignature: deleteSig,
        duplicateSignature,
        copySignatureToAllPages,
        updateSignatureFontSize,
        removeSignaturesByEmail,
        isFieldPending: isPending,
        syncStatus,
        loadFields,
      })}
    </>
  );
}

// Export a simpler version without signers for testing
export function SignatureFieldManager({
  documentId,
  children,
}: SignatureFieldManagerProps) {
  return (
    <SignatureFieldManagerWithSigners
      documentId={documentId}
      signerMappings={[]}
      numPages={null}
    >
      {children}
    </SignatureFieldManagerWithSigners>
  );
}
