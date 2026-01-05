// hooks/useSignatureOperations.ts
import { useCallback } from "react";
import { PlacedSignature } from "@/components/documents/signing/types";

interface UseSignatureOperationsProps {
  signatures: PlacedSignature[];
  setSignatures: React.Dispatch<React.SetStateAction<PlacedSignature[]>>;
  numPages: number | null;
  onSyncCreate?: (field: PlacedSignature, signerId: string) => Promise<void>;
  onSyncUpdate?: (field: PlacedSignature) => Promise<void>;
  onSyncDelete?: (fieldId: string) => Promise<void>;
  getSignerIdForEmail?: (email: string) => string | null;
}

export function useSignatureOperations({
  signatures,
  setSignatures,
  numPages,
  onSyncCreate,
  onSyncUpdate,
  onSyncDelete,
  getSignerIdForEmail,
}: UseSignatureOperationsProps) {
  /**
   * Create a new signature field
   */
  const createSignature = useCallback(
    async (signature: PlacedSignature) => {
      // Add to local state immediately (optimistic update)
      setSignatures((prev) => [...prev, signature]);

      // Sync to database if handler provided
      if (onSyncCreate && getSignerIdForEmail) {
        const signerId = getSignerIdForEmail(signature.email);
        if (signerId) {
          try {
            await onSyncCreate(signature, signerId);
          } catch (error) {
            console.error("Failed to sync signature creation:", error);
            // Rollback on error
            setSignatures((prev) => prev.filter((s) => s.id !== signature.id));
            throw error;
          }
        }
      }

      return signature.id;
    },
    [setSignatures, onSyncCreate, getSignerIdForEmail]
  );

  /**
   * Update an existing signature field
   */
  const updateSignature = useCallback(
    async (id: string, updates: Partial<PlacedSignature>) => {
      let updatedSignature: PlacedSignature | null = null;

      // Update local state immediately (optimistic)
      setSignatures((prev) =>
        prev.map((sig) => {
          if (sig.id === id) {
            updatedSignature = { ...sig, ...updates };
            return updatedSignature;
          }
          return sig;
        })
      );

      // Sync to database if handler provided
      if (onSyncUpdate && updatedSignature) {
        try {
          await onSyncUpdate(updatedSignature);
        } catch (error) {
          console.error("Failed to sync signature update:", error);
          // Optionally rollback on error
          // For now, we keep optimistic update even on failure
        }
      }
    },
    [setSignatures, onSyncUpdate]
  );

  /**
   * Delete a signature field
   */
  const deleteSignature = useCallback(
    async (id: string) => {
      // Store for potential rollback
      const deletedSignature = signatures.find((s) => s.id === id);

      // Remove from local state immediately (optimistic)
      setSignatures((prev) => prev.filter((sig) => sig.id !== id));

      // Sync to database if handler provided
      if (onSyncDelete) {
        try {
          await onSyncDelete(id);
        } catch (error) {
          console.error("Failed to sync signature deletion:", error);
          // Rollback on error
          if (deletedSignature) {
            setSignatures((prev) => [...prev, deletedSignature]);
          }
          throw error;
        }
      }
    },
    [signatures, setSignatures, onSyncDelete]
  );

  /**
   * Duplicate a signature field
   */
  const duplicateSignature = useCallback(
    async (id: string) => {
      const source = signatures.find((s) => s.id === id);
      if (!source) return null;

      const newSignature: PlacedSignature = {
        ...source,
        id: `sig-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        x: source.x + 16,
        y: source.y + 16,
      };

      await createSignature(newSignature);
      return newSignature.id;
    },
    [signatures, createSignature]
  );

  /**
   * Copy signature to all pages
   */
  const copySignatureToAllPages = useCallback(
    async (id: string) => {
      const source = signatures.find((s) => s.id === id);
      if (!source || !numPages) return;

      const newSignatures: PlacedSignature[] = [];

      for (let page = 1; page <= numPages; page++) {
        if (page === source.page) continue;

        newSignatures.push({
          ...source,
          id: `sig-${Date.now()}-${page}-${Math.random()
            .toString(36)
            .substr(2, 9)}`,
          page,
        });
      }

      // Add all to local state
      setSignatures((prev) => [...prev, ...newSignatures]);

      // Sync each to database
      if (onSyncCreate && getSignerIdForEmail) {
        const signerId = getSignerIdForEmail(source.email);
        if (signerId) {
          await Promise.allSettled(
            newSignatures.map((sig) => onSyncCreate(sig, signerId))
          );
        }
      }

      return newSignatures.map((s) => s.id);
    },
    [signatures, numPages, setSignatures, onSyncCreate, getSignerIdForEmail]
  );

  /**
   * Update font size for a signature
   */
  const updateSignatureFontSize = useCallback(
    async (id: string, fontSize: number) => {
      await updateSignature(id, { fontSize });
    },
    [updateSignature]
  );

  /**
   * Remove signatures by recipient email
   */
  const removeSignaturesByEmail = useCallback(
    (email: string) => {
      setSignatures((prev) => prev.filter((sig) => sig.email !== email));
    },
    [setSignatures]
  );

  return {
    createSignature,
    updateSignature,
    deleteSignature,
    duplicateSignature,
    copySignatureToAllPages,
    updateSignatureFontSize,
    removeSignaturesByEmail,
  };
}
