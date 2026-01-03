// components/editor/FieldToolbox.tsx
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Signature,
  User,
  CalendarDays,
  Type,
  SquareCheckBig,
} from "lucide-react";

type FieldType =
  | "signature"
  | "initials"
  | "date"
  | "text"
  | "checkbox";

type FieldToolboxProps = {
  onAddField: (type: FieldType) => void;
};

const fields = [
  { type: "signature" as const, icon: Signature, label: "Signature" },
  { type: "initials" as const, icon: User, label: "Initials" },
  { type: "date" as const, icon: CalendarDays, label: "Date Signed" },
  { type: "text" as const, icon: Type, label: "Text Box" },
  { type: "checkbox" as const, icon: SquareCheckBig, label: "Checkbox" },
];

export default function FieldToolbox({ onAddField }: FieldToolboxProps) {
  return (
    <Card className="h-fit sticky top-6 shadow-lg">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold">Add Fields</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3">
        {fields.map(({ type, icon: Icon, label }) => (
          <Button
            key={type}
            variant="outline"
            className="w-full justify-start gap-3 h-14 hover:bg-blue-50 hover:border-blue-400 transition-all"
            onClick={() => onAddField(type)}
          >
            <Icon className="w-6 h-6 text-blue-600" />
            <span className="font-medium">{label}</span>
          </Button>
        ))}

        {/* Future: Search bar */}
        <div className="pt-4 border-t">
          <input
            type="text"
            placeholder="Search fields..."
            className="w-full px-4 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled
          />
        </div>
      </CardContent>
    </Card>
  );
}