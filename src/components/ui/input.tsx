"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        ref={ref}
        className={cn(
          "flex h-11 w-full rounded-full border border-white/10 bg-[#2a2320] px-5 py-2 text-sm text-white placeholder:text-white/40 transition-all",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/60 focus-visible:border-orange-500/30",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-white",
          className
        )}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
