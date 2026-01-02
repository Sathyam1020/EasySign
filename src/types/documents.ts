export type DashboardDocument = {
  id: string;
  fileName: string;
  fileSize: number;
  status: "pending" | "signed"
  trackingToken: string;
  createdAt: string;
};

export type Theme = {
  base: string
  blob: string
}