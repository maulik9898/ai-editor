import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "@copilotkit/react-ui/styles.css";
import { ThemeProvider } from "@/components/theme-provider";
import { CopilotKit } from "@copilotkit/react-core";
import { KnowledgeBaseProvider } from "@/contexts/knowledge-base-context";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AI Editor",
  description: "AI-powered file editor with intelligent editing capabilities",
};

// CopilotKit configuration
const runtimeUrl =
  process.env.NEXT_PUBLIC_COPILOTKIT_RUNTIME_URL || "/api/copilotkit";
const publicApiKey = process.env.NEXT_PUBLIC_COPILOT_API_KEY;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased h-full w-full`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <KnowledgeBaseProvider>
            <CopilotKit
              forwardedParameters={{
                temperature: 0,
              }}
              showDevConsole={true}
              runtimeUrl={runtimeUrl}
              publicApiKey={publicApiKey}
            >
              {children}
            </CopilotKit>
          </KnowledgeBaseProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
