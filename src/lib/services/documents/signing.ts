// services/documents/signing.ts

import { getApiUrl } from "@/lib/api";

export interface SigningData {
  signer: {
    id: string;
    name: string;
    email: string;
    status: string;
  };
  document: {
    id: string;
    fileName: string;
    fileUrl: string;
    pageCount: number;
    subject?: string;
    message?: string;
  };
  fields: Array<{
    id: string;
    pageNumber: number;
    x: number;
    y: number;
    width: number;
    height: number;
    fieldType: string;
    fontSize: number;
    value?: string;
  }>;
}

export async function getSigningData(token: string): Promise<SigningData> {
  const res = await fetch(`${getApiUrl()}/sign/${token}`, {
    credentials: "include",
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data?.error || "Failed to load signing data");
  }

  return res.json();
}

export async function getDocumentDownloadUrl(token: string): Promise<string> {
  const res = await fetch(`${getApiUrl()}/sign/${token}/download`, {
    credentials: "include",
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data?.error || "Failed to get download URL");
  }

  const { downloadUrl } = await res.json();
  return downloadUrl;
}
