"use client";

import { createTheme, MantineProvider } from "@mantine/core";
import LetsForm from "lets-form/react-mantine";
import { useTheme } from "@/hooks/use-theme";
import { useFieldInspector } from "@/hooks/use-field-inspector";

// Import scoped styles
import "./mantine-isolated.css";
import "./field-inspector.css";
import { useEffect, useState } from "react";

interface LetsFormMantineProps {
  formData: any;
  enableFieldInspector?: boolean;
}
export default function LetsFormMantine({
  formData,
  enableFieldInspector = true,
}: LetsFormMantineProps) {
  const { getMantineColorScheme } = useTheme();
  const [error, setError] = useState<string | null>(null);

  // Add field inspector functionality
  const { isEnhanced } = useFieldInspector({
    enabled: enableFieldInspector,
    containerSelector: ".mantine-isolated",
  });

  const handleError = (err: any) => {
    setError(err?.message || "An error occurred");
  };

  const handleJavascriptError = (err: any) => {
    setError(err?.message || "A JavaScript error occurred");
  };

  return (
    <div className="mantine-isolated">
      <MantineProvider forceColorScheme={getMantineColorScheme()}>
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline">{error}</span>
            <button
              onClick={() => setError(null)}
              className="float-right font-bold text-red-700 hover:text-red-900"
            >
              ×
            </button>
          </div>
        )}

        <LetsForm
          onError={handleError}
          onJavascriptError={handleJavascriptError}
          className="max-h-[90%]"
          form={formData}
        />
      </MantineProvider>

      {/* Optional: Debug info */}
      {process.env.NODE_ENV === "development" && (
        <div className="text-xs text-muted-foreground mt-2 px-2">
          Field Inspector: {isEnhanced ? "Active" : "Waiting for fields..."}
        </div>
      )}
    </div>
  );
}
