import type { Metadata } from "next";
import { Suspense } from "react";
import { Space_Grotesk, Inter } from "next/font/google";
import { ThemeProvider, themeInitScript } from "@/components/theme/theme-provider";
import { NotificationProvider } from "@/components/ui/notification";
import { NotificationRouteListener } from "@/components/ui/notification-route-listener";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Autopayze",
  description: "Send, schedule and automate crypto payments with an AI agent watching your wallet.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
       
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body
        className={`${spaceGrotesk.variable} ${inter.variable} font-body antialiased`}
        suppressHydrationWarning
      >
        <ThemeProvider>
          <NotificationProvider>
            <Suspense fallback={null}>
              <NotificationRouteListener />
            </Suspense>
            {children}
          </NotificationProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
