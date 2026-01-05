// components/ui/custom-checkbox.tsx
import * as React from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils"; // your shadcn cn utility

const CustomCheckbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(
      "peer h-5 w-5 shrink-0 rounded-md border-2 border-gray-500 bg-white transition-all duration-200 ease-in-out", // thick dark gray border, white bg
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2",
      "disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer",
      // Hover: gray fill
      "hover:bg-gray-300 hover:scale-110 hover:shadow-md",
      // Checked: blue border, white bg, blue tick
      "data-[state=checked]:border-[#165dfc] data-[state=checked]:border-3 data-[state=checked]:bg-white data-[state=checked]:scale-105 data-[state=checked]:shadow-lg",
      className
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator
      className={cn(
        "flex items-center justify-center text-[#165dfc] animate-in fade-in zoom-in-75 duration-200"
      )}
    >
      <Check className="h-4 w-5 stroke-[4px]" />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
));

CustomCheckbox.displayName = "CustomCheckbox";

export { CustomCheckbox };
