export type PlacedSignature = {
  x: number;
  y: number;
  fontSize: number;
  id: string;
  email: string;
  color: string;
  width: number;
  height: number;
  page: number;
};

export type DragState = {
  id: string;
  offsetX: number;
  offsetY: number;
} | null;

export type ResizeState = {
  id: string;
  startX: number;
  startY: number;
  startW: number;
  startH: number;
} | null;
