export type DashboardDocument = {
  id: string;
  fileName: string;
  fileSize: number;
  status: "draft" | "pending" | "completed";
  trackingToken: string;
  createdAt: string;
  recipients?: Array<{ email: string; name: string }>;
};

export type Theme = {
  base: string;
  blob: string;
};
