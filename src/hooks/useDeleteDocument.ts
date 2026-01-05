// hooks/useDeleteDocument.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteDocument } from "@/lib/services/documents/documents";

export function useDeleteDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (documentId: string) => deleteDocument(documentId),
    onSuccess: (_, documentId) => {
      // Refresh both the list and any document detail cache
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      queryClient.invalidateQueries({ queryKey: ["document", documentId] });
    },
    onError: (error) => {
      console.error(error);
    },
  });
}
