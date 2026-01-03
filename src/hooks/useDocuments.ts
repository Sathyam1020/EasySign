// hooks/useDocuments.ts
import {
  createDocument,
  CreateDocumentPayload,
  fetchDocuments,
  getPresignedUrl,
} from "@/lib/services/documents/documents";
// import { DashboardDocument } from "@/types/documents";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// Fetch documents list
export const useDocuments = () => {
  return useQuery({
    queryKey: ["documents"],
    queryFn: fetchDocuments,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

// Upload mutation (presigned + save)
export const useUploadDocument = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (file: any) => {
      // Step 1: Get presigned URL
      const { uploadUrl, fileUrl, key, activeOrgId } = await getPresignedUrl(
        file.name,
        file.size,
        file.type
      );

      console.log("Upload URL received:", uploadUrl);
      console.log("File URL:", fileUrl);

      // Step 2: Direct upload to S3
      const uploadResponse = await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type,
        },
      });

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        console.error("S3 Upload failed:", uploadResponse.status, errorText);
        throw new Error(
          `Failed to upload file to S3: ${uploadResponse.statusText}`
        );
      }

      console.log("S3 upload successful");

      // Step 3: Save metadata
      const payload: CreateDocumentPayload = {
        fileName: file.name,
        fileUrl,
        fileSize: file.size,
        key,
        activeOrgId,
      };

      return await createDocument(payload);
    },
    onSuccess: () => {
      // Invalidate and refetch documents list
      queryClient.invalidateQueries({ queryKey: ["documents"] });
    },
  });
};
