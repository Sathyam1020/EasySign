import axios from "axios"
import { getApiUrl } from "@/lib/api"

export async function renameActiveOrg(name: string) {
  const res = await axios.patch(`${getApiUrl()}/organisations/manage`, { name })
  return res.data.org
}

export async function deleteActiveOrg() {
  const res = await axios.delete(`${getApiUrl()}/organisations/manage`)
  return res.data
}
