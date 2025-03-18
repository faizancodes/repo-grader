import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster as UIToaster } from "@/components/ui/toaster";
import { AnalysisSidebar } from "@/components/analysis-sidebar";
import { cn } from "@/lib/utils";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
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
    <html lang="en" className="h-full">
      <body className={cn(inter.className, "h-full")}>
        <div className="flex min-h-full">
          <AnalysisSidebar />
          <main className="flex-1">{children}</main>
        </div>
        <UIToaster />
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
