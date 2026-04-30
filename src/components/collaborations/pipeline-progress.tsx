"use client";

import { Check } from "lucide-react";
import { PIPELINE_STEPS } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { Collaboration } from "@/lib/database.types";

export function PipelineProgress({ collab, compact = false }: { collab: Collaboration; compact?: boolean }) {
  const completedCount = PIPELINE_STEPS.filter((s) => collab[s.key as keyof Collaboration]).length;
  const total = PIPELINE_STEPS.length;
  const pct = (completedCount / total) * 100;
  const isDone = completedCount === total;

  if (compact) {
    return (
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[10px] text-white/40">
          <span>{completedCount}/{total} étapes</span>
          <span className={cn(isDone && "text-emerald-300")}>{Math.round(pct)}%</span>
        </div>
        <div className="h-1 bg-white/5 rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full transition-all rounded-full",
              isDone
                ? "bg-gradient-to-r from-emerald-500 to-teal-500"
                : "bg-gradient-to-r from-orange-500 to-rose-500"
            )}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-white/60">
        <span className="font-medium">Pipeline</span>
        <span className={cn("font-semibold", isDone && "text-emerald-300")}>
          {completedCount}/{total} · {Math.round(pct)}%
        </span>
      </div>
      <div className="grid grid-cols-8 gap-1">
        {PIPELINE_STEPS.map((step) => {
          const done = !!collab[step.key as keyof Collaboration];
          return (
            <div
              key={step.key}
              title={step.label + (done ? " ✓" : "")}
              className={cn(
                "h-2 rounded-full transition-all",
                done
                  ? isDone
                    ? "bg-gradient-to-r from-emerald-500 to-teal-500"
                    : "bg-gradient-to-r from-orange-500 to-rose-500"
                  : "bg-white/5"
              )}
            />
          );
        })}
      </div>
    </div>
  );
}

export function PipelineSteps({
  collab,
  onToggle,
}: {
  collab: Collaboration;
  onToggle?: (key: string, value: boolean) => void;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      {PIPELINE_STEPS.map((step) => {
        const done = !!collab[step.key as keyof Collaboration];
        return (
          <button
            key={step.key}
            type="button"
            onClick={() => onToggle?.(step.key, !done)}
            className={cn(
              "flex items-center gap-3 p-3 rounded-xl text-left transition-all border",
              done
                ? "bg-gradient-to-br from-orange-500/15 to-rose-500/10 border-orange-500/30"
                : "bg-white/[0.02] border-white/5 hover:bg-white/5"
            )}
          >
            <div
              className={cn(
                "w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition-colors",
                done ? "gradient-mood" : "border border-white/20"
              )}
            >
              {done && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
            </div>
            <span className={cn("text-sm", done ? "text-white" : "text-white/60")}>{step.label}</span>
          </button>
        );
      })}
    </div>
  );
}
