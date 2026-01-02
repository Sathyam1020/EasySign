import { getApiUrl } from "@/lib/api";

export const createOrg = async (name: string) => {
  const res = await fetch(`${getApiUrl()}/organisations/create`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    credentials: "include",
    body: JSON.stringify({ name }),
  });

  return res.json();
};
