import { getApiUrl } from "@/lib/api";

export async function getDocumentsOfOrg() {
  const res = await fetch(`${getApiUrl()}/documents/count`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  });

  const data = await res.json();
  return data.documents;
}
