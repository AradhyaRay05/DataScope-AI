"use client";

import { ErrorBoundary, NotificationProvider } from "@/components/ui";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <NotificationProvider>{children}</NotificationProvider>
    </ErrorBoundary>
  );
}
