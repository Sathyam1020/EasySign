export type PlacedSignature = {
  id: string;
  email: string;

  // Position & Size
  x: number;
  y: number;
  width: number;
  height: number;
  page: number;

  // Styling
  fontSize: number;
  fontFamily?: string;
  color: string;
  alignment?: "left" | "center" | "right";

  // Field metadata
  fieldType?: "signature" | "initials" | "date" | "text" | "checkbox";
  required?: boolean;
  placeholder?: string;

  // Signing data
  value?: string | null;
  signedAt?: Date | null;
};

export type DragState = {
  id: string;
  offsetX: number;
  offsetY: number;
} | null;

export type ResizeHandle = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";

export type ResizeState = {
  id: string;
  startX: number;
  startY: number;
  startW: number;
  startH: number;
  startCX: number;
  startCY: number;
  handle: ResizeHandle;
} | null;
