"use client";

import { Toaster as SonnerToaster, type ToasterProps } from "sonner";

export function Toaster(props: ToasterProps) {
  return (
    <SonnerToaster
      position="top-right"
      richColors
      closeButton
      toastOptions={{
        className:
          "rounded-lg border border-border bg-card text-card-foreground shadow-md",
      }}
      {...props}
    />
  );
}
