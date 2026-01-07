import { getApiUrl } from "@/lib/api";

export async function getDocumentsOfOrg() {
  const res = await fetch(`${getApiUrl()}/documents`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  });

  const data = await res.json();
  return data.documents;
}

export interface SearchDocumentsParams {
  query?: string;
  status?: "draft" | "pending" | "completed" | "all";
  page?: number;
  limit?: number;
  sortBy?: "createdAt" | "updatedAt" | "fileName";
  sortOrder?: "asc" | "desc";
}

export async function searchDocuments(params: SearchDocumentsParams = {}) {
  const searchParams = new URLSearchParams();

  if (params.query) searchParams.set("query", params.query);
  if (params.status) searchParams.set("status", params.status);
  if (params.page) searchParams.set("page", params.page.toString());
  if (params.limit) searchParams.set("limit", params.limit.toString());
  if (params.sortBy) searchParams.set("sortBy", params.sortBy);
  if (params.sortOrder) searchParams.set("sortOrder", params.sortOrder);

  const res = await fetch(
    `${getApiUrl()}/documents?${searchParams.toString()}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    }
  );

  if (!res.ok) {
    throw new Error("Failed to search documents");
  }

  const data = await res.json();
  return data;
}
