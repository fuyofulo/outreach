import type { Metadata } from "next";
import { SidebarNav } from "@/components/sidebar-nav";
import "./globals.css";

export const metadata: Metadata = {
  title: "Outreach Desk",
  description: "Track multi-platform outreach, follow-ups, and conversations.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="overflow-hidden">
        <div className="h-screen p-1 md:p-2">
          <div className="retro-main-shell h-full overflow-hidden lg:grid lg:grid-cols-[295px_minmax(0,1fr)]">
            <SidebarNav />
            <div className="min-h-0 overflow-hidden bg-[linear-gradient(180deg,rgba(255,255,255,0.12),rgba(255,255,255,0.04))] p-2 md:p-3 lg:p-4">
              <div className="mx-auto flex h-full min-h-0 max-w-[1460px] flex-col">
                {children}
              </div>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
