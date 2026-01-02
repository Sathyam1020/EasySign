import { getApiUrl } from "@/lib/api";

export const countOrgs = async () => {
  const res = await fetch(`${getApiUrl()}/organisations/me`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    credentials: "include",
  });

  return res.json();
};
