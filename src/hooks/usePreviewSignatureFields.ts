import { useQuery } from "@tanstack/react-query";
import { loadFields } from "@/lib/services/documents/fields";
import { PlacedSignature } from "@/components/documents/signing/types";

export interface PreviewSignature extends PlacedSignature {
  email: string;
  name?: string;
  color?: string;
  fieldType?: string;
  required?: boolean;
}

/**
 * Hook to fetch and map signature fields from database for preview
 */
export function usePreviewSignatureFields(documentId: string) {
  return useQuery({
    queryKey: ["documents", documentId, "fields"],
    queryFn: async () => {
      const fields = await loadFields(documentId);

      // Map database fields to PlacedSignature format
      const signatures: PreviewSignature[] = fields.map((field: any) => ({
        id: field.id,
        email: field.signer?.email || "",
        name: field.signer?.name || "",
        x: field.xPosition,
        y: field.yPosition,
        width: field.width,
        height: field.height,
        page: field.pageNumber,
        fontSize: field.fontSize,
        fontFamily: field.fontFamily,
        color: field.color,
        fieldType: field.fieldType,
        required: field.required,
      }));

      return signatures;
    },
  });
}
