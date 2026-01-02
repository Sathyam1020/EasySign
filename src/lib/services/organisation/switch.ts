import { getApiUrl } from "@/lib/api";

export async function switchOrg(orgId: string) {
  await fetch(`${getApiUrl()}/organisations/switch`, {
    method: "POST",
    credentials: "include",
    body: JSON.stringify({ orgId })
  });
}
