// hooks/useDeleteDocument.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteDocument } from "@/lib/services/documents/documents";

export function useDeleteDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (documentId: string) => deleteDocument(documentId),
    onSuccess: (_, documentId) => {
      // Invalidate all documents queries with partial matching
      queryClient.invalidateQueries({
        queryKey: ["documents"],
        exact: false, // This ensures it matches ["documents", activeOrg] etc.
      });
      queryClient.invalidateQueries({ queryKey: ["document", documentId] });
    },
    onError: (error) => {
      console.error(error);
    },
  });
}
