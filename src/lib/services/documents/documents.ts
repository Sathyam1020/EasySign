// services/documentService.ts

import { getApiUrl } from "@/lib/api";
import axios from "axios";

export type UploadUrlResponse = {
  success: boolean;
  uploadUrl: string;
  fileUrl: string;
  key: string;
  activeOrgId: string;
};

export type CreateDocumentPayload = {
  fileName: string;
  fileUrl: string;
  fileSize: number;
  key: string;
  activeOrgId: string;
};

export type Document = {
  id: string;
  fileName: string;
  fileUrl: string;
  status: string;
  createdAt: string;
  fileSize: number;
  orgId: string;
};

// 1. Get presigned URL
export const getPresignedUrl = async (
  fileName: string,
  fileSize: number,
  fileType: string
): Promise<UploadUrlResponse> => {
  const response = await axios.post(`${getApiUrl()}/documents/upload-url`, {
    fileName,
    fileSize,
    fileType,
  });
  return response.data;
};

// 2. Save document metadata after S3 upload
export const createDocument = async (
  payload: CreateDocumentPayload
): Promise<{ success: true; document: Document }> => {
  const response = await axios.post(`${getApiUrl()}/documents`, payload);
  return response.data;
};

// 3. Fetch all documents (for list)
export const fetchDocuments = async (): Promise<Document[]> => {
  const response = await axios.get(`${getApiUrl()}/documents`);
  return response.data.documents;
};


export async function getDocumentViewUrl(documentId: string) {
  const res = await fetch(`${getApiUrl()}/documents/view-url/${documentId}`, {
    credentials: "include",
  });

  if (!res.ok) throw new Error("Failed to get view url");
  const data = await res.json();

  return data;
}

export async function getDocumentMeta(documentId: string) {
  const res = await fetch(`${getApiUrl()}/documents/${documentId}`, {
    credentials: "include",
  });

  if (!res.ok) throw new Error("Document not found");

  return res.json();
}
