import { FileItem } from "@/constants/types";

type Props = FileItem;

export function FileCard({ name, theme, signed }: Props) {
  return (
    <div className="rounded-2xl overflow-hidden bg-white w-72 cursor-pointer shadow-md hover:shadow-lg transition-all duration-200">
      <div
        className="relative h-42 flex items-center justify-center text-lg font-medium overflow-hidden"
        style={{ backgroundColor: theme.base }}
      >
        <span className="relative z-10 text-2xl font-light">{name}</span>

        <svg
          viewBox="0 0 200 200"
          className="absolute inset-0 h-full w-full pointer-events-none"
          preserveAspectRatio="none"
        >
          <path
            d="
                M140 0
                C155 40 155 80 140 120
                C125 160 125 200 140 200
                L200 200
                L200 0
                Z
            "
            fill={theme.blob}
          />
        </svg>
      </div>

      <div className="flex justify-between items-center px-4 py-4 text-sm text-gray-500">
        <span>{signed ? "Signed" : "Not signed"}</span>
        <span className="text-xl cursor-pointer">⋯</span>
      </div>
    </div>
  );
}
