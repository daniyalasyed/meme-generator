import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Meme Generator",
  description: "Create, post, and upvote memes with InstantDB."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
