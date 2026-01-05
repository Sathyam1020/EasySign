// services/documents/fields.ts

import { getApiUrl } from "@/lib/api";
import axios from "axios";
import { PlacedSignature } from "@/components/documents/signing/types";

export interface CreateFieldPayload {
  signerId: string;
  pageNumber: number;
  xPosition: number;
  yPosition: number;
  width: number;
  height: number;
  fieldType?: string;
  required?: boolean;
  fontSize: number;
  fontFamily?: string;
  color: string;
  alignment?: string;
  placeholder?: string;
}

export interface UpdateFieldPayload {
  xPosition?: number;
  yPosition?: number;
  width?: number;
  height?: number;
  pageNumber?: number;
  fontSize?: number;
  fontFamily?: string;
  color?: string;
  alignment?: string;
  placeholder?: string;
  required?: boolean;
}

export interface SignatureField {
  id: string;
  documentId: string;
  signerId: string;
  pageNumber: number;
  xPosition: number;
  yPosition: number;
  width: number;
  height: number;
  fieldType: string;
  required: boolean;
  fontSize: number;
  fontFamily: string;
  color: string;
  alignment: string;
  placeholder?: string;
  createdAt: string;
  updatedAt: string;
  signer?: {
    id: string;
    email: string;
    name: string;
    status: string;
  };
}

/**
 * Load all signature fields for a document
 */
export const loadFields = async (
  documentId: string
): Promise<SignatureField[]> => {
  const response = await axios.get(
    `${getApiUrl()}/documents/${documentId}/fields`
  );
  return response.data;
};

/**
 * Create a new signature field
 */
export const createField = async (
  documentId: string,
  payload: CreateFieldPayload
): Promise<SignatureField> => {
  const response = await axios.post(
    `${getApiUrl()}/documents/${documentId}/fields`,
    payload
  );
  return response.data;
};

/**
 * Update a signature field (position, size, styling)
 */
export const updateField = async (
  documentId: string,
  fieldId: string,
  payload: UpdateFieldPayload
): Promise<SignatureField> => {
  const response = await axios.patch(
    `${getApiUrl()}/documents/${documentId}/fields/${fieldId}`,
    payload
  );
  return response.data;
};

/**
 * Delete a signature field
 */
export const deleteField = async (
  documentId: string,
  fieldId: string
): Promise<void> => {
  await axios.delete(
    `${getApiUrl()}/documents/${documentId}/fields/${fieldId}`
  );
};
