import axios, { AxiosError } from "axios";
import { getApiUrl } from "@/lib/api";

export async function renameActiveOrg(name: string) {
  const res = await axios.patch(`${getApiUrl()}/organisations/manage`, {
    name,
  });
  return res.data.org;
}

export async function deleteActiveOrg() {
  try {
    const res = await axios.delete(`${getApiUrl()}/organisations/manage`);
    return res.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosErr = error as AxiosError<{
        error?: string;
        message?: string;
      }>;
      // Prefer server-provided error message (e.g., "Delete all documents first")
      const message =
        axiosErr.response?.data?.error ||
        axiosErr.response?.data?.message ||
        axiosErr.message;
      throw new Error(message);
    }

    throw error;
  }
}
