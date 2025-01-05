import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { AnalysisSidebar } from "@/components/analysis-sidebar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "GitHub Repo Analyzer",
  description:
    "Get feedback on your code quality and get suggestions on how to improve it.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="flex">
          <AnalysisSidebar />
          {children}
        </div>
        <Toaster />
      </body>
    </html>
  );
}
