"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/instant";
import { isAdmin } from "@/lib/templates";

type MemeRecord = {
  id: string;
  imageUrl?: string;
  imagePath?: string;
  caption?: string;
  authorName?: string;
};

type FileRecord = {
  id: string;
  path?: string;
  url?: string;
};

export default function FixMemesPage() {
  const router = useRouter();
  const { isLoading: authLoading, user } = db.useAuth();

  const [status, setStatus] = useState<string>("");
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<{ fixed: string[]; notFound: string[]; alreadyOk: string[] } | null>(null);

  if (authLoading) {
    return (
      <div className="app" style={{ padding: "2rem", textAlign: "center" }}>
        <p style={{ color: "var(--text-muted)" }}>Loading...</p>
      </div>
    );
  }

  if (!user || !isAdmin(user.email)) {
    router.push("/");
    return null;
  }

  async function runMigration() {
    setIsRunning(true);
    setStatus("Fetching memes and files...");
    setResults(null);

    try {
      const memesQuery = await db.queryOnce({ memes: {} });
      const filesQuery = await db.queryOnce({ $files: {} });

      const memes = (memesQuery.data?.memes ?? []) as MemeRecord[];
      const files = (filesQuery.data?.$files ?? []) as FileRecord[];

      setStatus(`Found ${memes.length} memes and ${files.length} files`);

      const filesByPath = new Map<string, FileRecord>();
      files.forEach((file) => {
        if (file.path) {
          filesByPath.set(file.path, file);
        }
      });

      const fixed: string[] = [];
      const notFound: string[] = [];
      const alreadyOk: string[] = [];

      for (const meme of memes) {
        if (meme.imageUrl) {
          alreadyOk.push(meme.id);
          continue;
        }

        if (!meme.imagePath) {
          notFound.push(`${meme.id} (no imagePath)`);
          continue;
        }

        const file = filesByPath.get(meme.imagePath);
        if (!file?.url) {
          notFound.push(`${meme.id} (path: ${meme.imagePath})`);
          continue;
        }

        setStatus(`Fixing meme ${meme.id}...`);
        await db.transact(
          db.tx.memes[meme.id].update({ imageUrl: file.url })
        );
        fixed.push(meme.id);
      }

      setResults({ fixed, notFound, alreadyOk });
      setStatus("Migration complete!");
    } catch (err) {
      setStatus(`Error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsRunning(false);
    }
  }

  return (
    <div className="app" style={{ padding: "2rem", maxWidth: "800px", margin: "0 auto" }}>
      <h1 style={{ marginBottom: "1rem" }}>Fix Broken Memes</h1>
      <p style={{ marginBottom: "1rem", color: "#666" }}>
        This migration finds memes with missing imageUrl and attempts to recover
        the URL from the $files table using the imagePath.
      </p>

      <button
        onClick={runMigration}
        disabled={isRunning}
        style={{
          padding: "0.75rem 1.5rem",
          fontSize: "1rem",
          backgroundColor: isRunning ? "#ccc" : "#10b981",
          color: "white",
          border: "none",
          borderRadius: "6px",
          cursor: isRunning ? "not-allowed" : "pointer"
        }}
      >
        {isRunning ? "Running..." : "Run Migration"}
      </button>

      {status && (
        <p style={{ marginTop: "1rem", padding: "0.75rem", backgroundColor: "#f3f4f6", borderRadius: "6px" }}>
          {status}
        </p>
      )}

      {results && (
        <div style={{ marginTop: "1.5rem" }}>
          <h2 style={{ fontSize: "1.25rem", marginBottom: "0.5rem" }}>Results</h2>
          
          <div style={{ marginBottom: "1rem" }}>
            <strong style={{ color: "#10b981" }}>Fixed ({results.fixed.length}):</strong>
            {results.fixed.length > 0 ? (
              <ul style={{ marginTop: "0.5rem", paddingLeft: "1.5rem" }}>
                {results.fixed.map((id) => (
                  <li key={id} style={{ fontFamily: "monospace", fontSize: "0.875rem" }}>{id}</li>
                ))}
              </ul>
            ) : (
              <p style={{ color: "#666", marginTop: "0.25rem" }}>None</p>
            )}
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <strong style={{ color: "#f59e0b" }}>Already OK ({results.alreadyOk.length}):</strong>
            <p style={{ color: "#666", marginTop: "0.25rem" }}>
              {results.alreadyOk.length} memes already have valid imageUrl
            </p>
          </div>

          <div>
            <strong style={{ color: "#ef4444" }}>Could not fix ({results.notFound.length}):</strong>
            {results.notFound.length > 0 ? (
              <ul style={{ marginTop: "0.5rem", paddingLeft: "1.5rem" }}>
                {results.notFound.map((id) => (
                  <li key={id} style={{ fontFamily: "monospace", fontSize: "0.875rem" }}>{id}</li>
                ))}
              </ul>
            ) : (
              <p style={{ color: "#666", marginTop: "0.25rem" }}>None</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
