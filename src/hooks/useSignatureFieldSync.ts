// hooks/useSignatureFieldSync.ts
import { useState, useCallback, useRef, useEffect } from "react";
import { PlacedSignature } from "@/components/documents/signing/types";
import { randomUUID } from "crypto";
import {
  createField as createFieldService,
  updateField as updateFieldService,
  deleteField as deleteFieldService,
  loadFields as loadFieldsService,
  type CreateFieldPayload,
  type UpdateFieldPayload,
} from "@/lib/services/documents/fields";

type PendingOperation = {
  fieldId: string;
  operation: "create" | "update" | "delete";
  data: any;
  timestamp: number;
};

type FieldSyncState = {
  // Track which fields are being created
  pendingCreates: Set<string>;
  // Track which fields have been synced to DB
  syncedFields: Map<string, string>; // clientId -> dbId
  // Queue of operations waiting for create to complete
  operationQueue: PendingOperation[];
};

export function useSignatureFieldSync(documentId: string) {
  const [syncState, setSyncState] = useState<FieldSyncState>({
    pendingCreates: new Set(),
    syncedFields: new Map(),
    operationQueue: [],
  });

  // Debounce timers for position updates
  const updateTimers = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Track in-flight requests to prevent duplicates
  const inFlightRequests = useRef<Set<string>>(new Set());

  /**
   * Generate a client-side UUID for immediate use
   */
  const generateFieldId = useCallback(() => {
    // Use timestamp + random for uniqueness
    return `field-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  /**
   * Create a new signature field in the database
   */
  const createField = useCallback(
    async (field: PlacedSignature, signerId: string) => {
      const clientId = field.id;

      // Mark as pending
      setSyncState((prev) => ({
        ...prev,
        pendingCreates: new Set([...prev.pendingCreates, clientId]),
      }));

      try {
        const payload: CreateFieldPayload = {
          signerId,
          pageNumber: field.page,
          xPosition: field.x,
          yPosition: field.y,
          width: field.width,
          height: field.height,
          fieldType: field.fieldType || "signature",
          required: field.required ?? true,
          fontSize: field.fontSize,
          fontFamily: field.fontFamily || "Arial",
          color: field.color,
          alignment: field.alignment || "left",
          placeholder: field.placeholder,
        };

        const dbField = await createFieldService(documentId, payload);

        // Update sync state
        setSyncState((prev) => {
          const newPending = new Set(prev.pendingCreates);
          newPending.delete(clientId);

          const newSynced = new Map(prev.syncedFields);
          newSynced.set(clientId, dbField.id);

          return {
            ...prev,
            pendingCreates: newPending,
            syncedFields: newSynced,
          };
        });

        // Process any queued operations for this field
        processQueuedOperations(clientId);

        return dbField.id;
      } catch (error) {
        console.error("Error creating field:", error);

        // Remove from pending on error
        setSyncState((prev) => {
          const newPending = new Set(prev.pendingCreates);
          newPending.delete(clientId);
          return { ...prev, pendingCreates: newPending };
        });

        throw error;
      }
    },
    [documentId]
  );

  /**
   * Update a signature field position/size with debouncing
   */
  const updateField = useCallback(
    async (field: PlacedSignature, immediate = false) => {
      const clientId = field.id;

      // Check if this field is still being created
      if (syncState.pendingCreates.has(clientId)) {
        // Queue the update
        setSyncState((prev) => ({
          ...prev,
          operationQueue: [
            ...prev.operationQueue,
            {
              fieldId: clientId,
              operation: "update",
              data: field,
              timestamp: Date.now(),
            },
          ],
        }));
        return;
      }

      // Get the DB ID
      const dbId = syncState.syncedFields.get(clientId) || clientId;

      // Clear existing timer for this field
      const existingTimer = updateTimers.current.get(clientId);
      if (existingTimer) {
        clearTimeout(existingTimer);
      }

      // Debounce unless immediate
      const delay = immediate ? 0 : 300; // 300ms debounce

      const timer = setTimeout(async () => {
        // Check if already in-flight
        const requestKey = `update-${dbId}`;
        if (inFlightRequests.current.has(requestKey)) {
          return;
        }

        inFlightRequests.current.add(requestKey);

        try {
          const payload: UpdateFieldPayload = {
            xPosition: field.x,
            yPosition: field.y,
            width: field.width,
            height: field.height,
            pageNumber: field.page,
            fontSize: field.fontSize,
            fontFamily: field.fontFamily,
            color: field.color,
            alignment: field.alignment,
            placeholder: field.placeholder,
            required: field.required,
          };

          await updateFieldService(documentId, dbId, payload);
        } catch (error) {
          console.error("Error updating field:", error);
        } finally {
          inFlightRequests.current.delete(requestKey);
          updateTimers.current.delete(clientId);
        }
      }, delay);

      updateTimers.current.set(clientId, timer);
    },
    [documentId, syncState.pendingCreates, syncState.syncedFields]
  );

  /**
   * Delete a signature field
   */
  const deleteField = useCallback(
    async (fieldId: string) => {
      // Check if this field is still being created
      if (syncState.pendingCreates.has(fieldId)) {
        // Just remove from pending, don't send delete to server
        setSyncState((prev) => {
          const newPending = new Set(prev.pendingCreates);
          newPending.delete(fieldId);
          return { ...prev, pendingCreates: newPending };
        });
        return;
      }

      // Get the DB ID
      const dbId = syncState.syncedFields.get(fieldId) || fieldId;

      try {
        await deleteFieldService(documentId, dbId);

        // Remove from synced fields
        setSyncState((prev) => {
          const newSynced = new Map(prev.syncedFields);
          newSynced.delete(fieldId);
          return { ...prev, syncedFields: newSynced };
        });
      } catch (error) {
        console.error("Error deleting field:", error);
        throw error;
      }
    },
    [documentId, syncState.pendingCreates, syncState.syncedFields]
  );

  /**
   * Process queued operations for a field once it's created
   */
  const processQueuedOperations = useCallback(
    (clientId: string) => {
      setSyncState((prev) => {
        const queuedOps = prev.operationQueue.filter(
          (op) => op.fieldId === clientId
        );
        const remainingOps = prev.operationQueue.filter(
          (op) => op.fieldId !== clientId
        );

        // Execute queued operations
        queuedOps.forEach((op) => {
          if (op.operation === "update") {
            updateField(op.data, true); // immediate = true
          } else if (op.operation === "delete") {
            deleteField(clientId);
          }
        });

        return {
          ...prev,
          operationQueue: remainingOps,
        };
      });
    },
    [updateField, deleteField]
  );

  /**
   * Load existing fields from database on mount
   */
  const loadFields = useCallback(async () => {
    try {
      const fields = await loadFieldsService(documentId);

      // Mark all loaded fields as synced
      const syncedMap = new Map<string, string>();
      fields.forEach((field: any) => {
        syncedMap.set(field.id, field.id);
      });

      setSyncState((prev) => ({
        ...prev,
        syncedFields: syncedMap,
      }));

      return fields;
    } catch (error) {
      console.error("Error loading fields:", error);
      return [];
    }
  }, [documentId]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      updateTimers.current.forEach((timer) => clearTimeout(timer));
      updateTimers.current.clear();
    };
  }, []);

  return {
    generateFieldId,
    createField,
    updateField,
    deleteField,
    loadFields,
    isPending: (fieldId: string) => syncState.pendingCreates.has(fieldId),
    getSyncedCount: () => syncState.syncedFields.size,
    getPendingCount: () => syncState.pendingCreates.size,
  };
}
