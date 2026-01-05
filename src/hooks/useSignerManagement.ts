// hooks/useSignerManagement.ts
import { useState, useCallback, useEffect } from "react";
import {
  loadSigners as loadSignersService,
  createSigner as createSignerService,
  deleteSigner as deleteSignerService,
  type Signer,
} from "@/lib/services/documents/signers";

interface Recipient {
  id: string;
  email: string;
  name: string;
  signingOrder?: number;
}

interface SignerInfo {
  recipientId: string;
  email: string;
  name: string;
  signerId: string | null;
  isCreating: boolean;
  error: string | null;
}

/**
 * useSignerManagement
 *
 * Manages creating signers in the database from recipients.
 * Handles syncing recipients with database signers.
 */
export function useSignerManagement(documentId: string) {
  const [signers, setSigners] = useState<Map<string, SignerInfo>>(new Map());
  const [isLoadingSigners, setIsLoadingSigners] = useState(false);

  /**
   * Load existing signers from the database on mount
   */
  const loadSignersFromDb = useCallback(async () => {
    setIsLoadingSigners(true);
    try {
      const dbSigners = await loadSignersService(documentId);

      // Map database signers to internal state
      const signerMap = new Map<string, SignerInfo>();
      dbSigners.forEach((dbSigner: any) => {
        signerMap.set(dbSigner.id, {
          recipientId: dbSigner.id,
          email: dbSigner.email,
          name: dbSigner.name,
          signerId: dbSigner.id,
          isCreating: false,
          error: null,
        });
      });

      setSigners(signerMap);
    } catch (error) {
      console.error("Failed to load signers:", error);
    } finally {
      setIsLoadingSigners(false);
    }
  }, [documentId]);

  // Load signers on mount
  useEffect(() => {
    loadSignersFromDb();
  }, [loadSignersFromDb]);

  /**
   * Create a signer in the database
   */
  const createSigner = useCallback(
    async (recipient: Recipient) => {
      const existingSigner = signers.get(recipient.id);
      if (existingSigner?.signerId) {
        return existingSigner.signerId; // Already created
      }

      // Mark as creating
      setSigners((prev) => {
        const newMap = new Map(prev);
        newMap.set(recipient.id, {
          recipientId: recipient.id,
          email: recipient.email,
          name: recipient.name,
          signerId: null,
          isCreating: true,
          error: null,
        });
        return newMap;
      });

      try {
        const data = await createSignerService(documentId, {
          email: recipient.email,
          name: recipient.name,
          order: recipient.signingOrder ?? 0,
        });

        // Update with created signer
        setSigners((prev) => {
          const newMap = new Map(prev);
          newMap.set(recipient.id, {
            recipientId: recipient.id,
            email: recipient.email,
            name: recipient.name,
            signerId: data.id,
            isCreating: false,
            error: null,
          });
          return newMap;
        });

        return data.id;
      } catch (error) {
        const errorMsg =
          error instanceof Error ? error.message : "Unknown error";
        console.error("Failed to create signer:", errorMsg);

        setSigners((prev) => {
          const newMap = new Map(prev);
          newMap.set(recipient.id, {
            recipientId: recipient.id,
            email: recipient.email,
            name: recipient.name,
            signerId: null,
            isCreating: false,
            error: errorMsg,
          });
          return newMap;
        });

        throw error;
      }
    },
    [documentId, signers]
  );

  /**
   * Ensure signer exists for recipient
   * Creates it if needed, returns existing ID if already created
   */
  const ensureSigner = useCallback(
    async (recipient: Recipient): Promise<string | null> => {
      const existingSigner = signers.get(recipient.id);

      // Already created
      if (existingSigner?.signerId) {
        return existingSigner.signerId;
      }

      // Already creating or failed, return null
      if (existingSigner?.isCreating) {
        // Wait for creation to complete (max 5 seconds)
        let attempts = 50; // 50 * 100ms = 5 seconds
        while (attempts > 0) {
          const updated = signers.get(recipient.id);
          if (updated?.signerId) return updated.signerId;
          if (updated?.error) return null;
          await new Promise((resolve) => setTimeout(resolve, 100));
          attempts--;
        }
        return null;
      }

      if (existingSigner?.error) {
        return null; // Previously failed, don't retry immediately
      }

      // Need to create
      try {
        return await createSigner(recipient);
      } catch {
        return null;
      }
    },
    [signers, createSigner]
  );

  /**
   * Get signer ID for email
   */
  const getSignerIdByEmail = useCallback(
    (email: string): string | null => {
      for (const signer of signers.values()) {
        if (signer.email === email && signer.signerId) {
          return signer.signerId;
        }
      }
      return null;
    },
    [signers]
  );

  /**
   * Sync multiple recipients at once
   */
  const syncRecipients = useCallback(
    async (recipients: Recipient[]) => {
      const promises = recipients.map((r) => ensureSigner(r));
      const results = await Promise.allSettled(promises);

      const successful = results.filter(
        (r) => r.status === "fulfilled" && r.value
      ).length;
      const failed = results.filter((r) => r.status === "rejected").length;

      return {
        successful,
        failed,
        total: recipients.length,
      };
    },
    [ensureSigner]
  );

  /**
   * Delete a signer
   */
  const deleteSigner = useCallback(
    async (recipientId: string) => {
      const signer = signers.get(recipientId);
      if (!signer?.signerId) return;

      try {
        await deleteSignerService(documentId, signer.signerId);

        setSigners((prev) => {
          const newMap = new Map(prev);
          newMap.delete(recipientId);
          return newMap;
        });
      } catch (error) {
        console.error("Failed to delete signer:", error);
        throw error;
      }
    },
    [documentId, signers]
  );

  return {
    signers,
    createSigner,
    ensureSigner,
    getSignerIdByEmail,
    syncRecipients,
    deleteSigner,
    loadSigners: loadSignersFromDb,
    isLoadingSigners,
  };
}
