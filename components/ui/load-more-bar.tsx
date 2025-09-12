"use client";
import * as React from "react";
import { Button } from "@/components/ui/button";

type LoadMoreBarProps = {
  hasMore: boolean;
  onLoadMore: () => void;
  remaining?: number;
  sticky?: boolean;
  className?: string;
  size?: number; // how many will be loaded on next click (for label)
};

export function LoadMoreBar({
  hasMore,
  onLoadMore,
  remaining,
  sticky = false,
  className = "",
  size,
}: LoadMoreBarProps) {
  if (!hasMore) return null;

  const label =
    typeof remaining === "number"
      ? remaining > 0
        ? `Load ${size ? Math.min(size, remaining) : "more"} (${remaining} left)`
        : "Load more"
      : "Load more";

  return (
    <div
      className={
        `w-full flex items-center justify-center ${sticky ? "fixed bottom-4 left-0 right-0 z-30" : "mt-4"} ` +
        "pointer-events-none"
      }
    >
      <div className={`pointer-events-auto inline-flex rounded-full px-2 py-1 ${className}`}>
        <Button variant="outline" onClick={onLoadMore} className="rounded-full">
          {label}
        </Button>
      </div>
    </div>
  );
}

export default LoadMoreBar;
