"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { db } from "@/lib/instant";
import { isAdmin } from "@/lib/templates";

export function NavBar() {
  const pathname = usePathname();
  const router = useRouter();
  const { isLoading, user } = db.useAuth();

  const isActive = (path: string) => {
    if (path === "/") return pathname === "/";
    return pathname.startsWith(path);
  };

  async function handleSignOut() {
    await db.auth.signOut();
  }

  return (
    <nav className="nav-bar">
      <div className="nav-tabs">
        <Link
          href="/"
          className={`nav-tab ${isActive("/") && pathname !== "/feed" && pathname !== "/auth" ? "active" : ""}`}
        >
          Create Meme
        </Link>
        <Link
          href="/feed"
          className={`nav-tab ${isActive("/feed") ? "active" : ""}`}
        >
          Feed
        </Link>
        {isAdmin(user?.email) && (
          <Link
            href="/admin"
            className={`nav-tab ${isActive("/admin") ? "active" : ""}`}
          >
            Admin
          </Link>
        )}
      </div>

      <div className="nav-auth">
        {isLoading ? (
          <span className="nav-loading">...</span>
        ) : user ? (
          <div className="nav-user">
            <span className="nav-email">{user.email || "User"}</span>
            <button
              type="button"
              className="nav-sign-out"
              onClick={handleSignOut}
            >
              Sign Out
            </button>
          </div>
        ) : (
          <button
            type="button"
            className="nav-sign-in"
            onClick={() => router.push("/auth")}
          >
            Sign In
          </button>
        )}
      </div>
    </nav>
  );
}
