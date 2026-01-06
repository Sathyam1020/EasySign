export type DashboardDocument = {
  id: string;
  fileName: string;
  fileSize: number;
  status: "draft" | "pending" | "completed";
  trackingToken: string;
  createdAt: string;
};

export type Theme = {
  base: string;
  blob: string;
};
