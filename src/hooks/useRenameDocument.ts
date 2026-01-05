// hooks/useRenameDocument.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { renameDocument } from '@/lib/services/documents/documents'; // adjust path

export function useRenameDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ documentId, newFileName }: { documentId: string; newFileName: string }) =>
      renameDocument(documentId, newFileName),
    onSuccess: (_, variables) => {
      // Invalidate or update cache so UI reflects new name
      queryClient.invalidateQueries({ queryKey: ['document', variables.documentId] });
      queryClient.invalidateQueries({ queryKey: ['documents'] }); // if you have a list

      // Optional: toast.success("Document renamed successfully!");
    },
    onError: (error) => {
      // Optional: toast.error(error.message || "Failed to rename document");
      console.error(error);
    },
  });
}