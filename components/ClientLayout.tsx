"use client";

import { NavBar } from "./NavBar";

export function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <NavBar />
      {children}
    </>
  );
}
