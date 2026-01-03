import { FileItem } from "@/constants/types";
import { Theme } from "@/types/documents";
import { Ellipsis } from "lucide-react";
import { useRouter } from "next/navigation";

type Props = {
  id: string;
  name: string;
  theme: Theme;
  status: string;
};

export function DocumentCard({ id, name, theme, status }: Props) {
  const router = useRouter();

  return (
    <div
      className="rounded-2xl overflow-hidden bg-white w-72 shadow-md hover:shadow-lg transition-all duration-200"
    >
      <div
        className="relative p-2 h-40 flex items-center cursor-pointer justify-center text-lg font-medium overflow-hidden"
        style={{ backgroundColor: theme.base }}
        onClick={() => router.push(`/documents/${id}`)}
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
        <span>{status}</span>
        <span className="text-xl cursor-pointer hover:bg-gray-100 p-1 hover:shadow-xs rounded-lg transition-all duration-200">
          <Ellipsis />
        </span>
      </div>
    </div>
  );
}
