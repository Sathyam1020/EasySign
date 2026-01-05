// services/documents/signers.ts

import { getApiUrl } from "@/lib/api";
import axios from "axios";

export interface SignerPayload {
  email: string;
  name: string;
  order?: number;
}

export interface Signer {
  id: string;
  documentId: string;
  email: string;
  name: string;
  order: number;
  status: "draft" | "pending" | "signed";
  signingToken: string;
  fieldCount: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Load all signers for a document
 */
export const loadSigners = async (documentId: string): Promise<Signer[]> => {
  const response = await axios.get(
    `${getApiUrl()}/documents/${documentId}/signers`
  );
  return response.data;
};

/**
 * Create a new signer for a document
 */
export const createSigner = async (
  documentId: string,
  payload: SignerPayload
): Promise<Signer> => {
  const response = await axios.post(
    `${getApiUrl()}/documents/${documentId}/signers`,
    payload
  );
  return response.data;
};

/**
 * Update a signer
 */
export const updateSigner = async (
  documentId: string,
  signerId: string,
  updates: Partial<Signer>
): Promise<Signer> => {
  const response = await axios.patch(
    `${getApiUrl()}/documents/${documentId}/signers/${signerId}`,
    updates
  );
  return response.data;
};

/**
 * Delete a signer
 */
export const deleteSigner = async (
  documentId: string,
  signerId: string
): Promise<void> => {
  await axios.delete(
    `${getApiUrl()}/documents/${documentId}/signers/${signerId}`
  );
};
