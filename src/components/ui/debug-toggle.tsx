"use client";

import { useDebugStore } from "@/stores/debug-store";
import { Button } from "@/components/ui/button";
import { Bug, BugOff } from "lucide-react";
import { useEffect, useState } from "react";

interface DebugToggleProps {
  size?: "sm" | "default" | "lg";
  className?: string;
}

export function DebugToggle({ size = "default", className }: DebugToggleProps) {
  const { isDebugEnabled, toggleDebug } = useDebugStore();
  const [mounted, setMounted] = useState(false);

  // Don't render until mounted to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size={size === "default" ? "default" : size}
        className={className}
      >
        <div className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size={size === "default" ? "default" : size}
      onClick={toggleDebug}
      className={className}
      title={`${isDebugEnabled ? "Disable" : "Enable"} debug mode`}
    >
      {isDebugEnabled ? (
        <Bug className="h-4 w-4 " />
      ) : (
        <BugOff className="h-4 w-4" />
      )}
    </Button>
  );
}
