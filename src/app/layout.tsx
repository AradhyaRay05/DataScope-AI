import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DataScope AI - Dataset Intelligence Platform",
  description:
    "Upload CSV or Excel datasets and instantly generate intelligent profiling, feature statistics, missing value analysis, correlation insights, interactive visualizations, data quality scores, and exportable reports.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
