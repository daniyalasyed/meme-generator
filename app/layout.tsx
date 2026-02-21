import type { Metadata } from "next";
import { Analytics } from '@vercel/analytics/next';
import { ClientLayout } from "@/components/ClientLayout";
import "./globals.css";

export const metadata: Metadata = {
  title: "Meme Generator",
  description: "Create, post, and upvote memes with InstantDB."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ClientLayout>{children}</ClientLayout>
        <Analytics />
      </body>
    </html>
  );
}
