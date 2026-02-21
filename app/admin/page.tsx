"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/instant";
import {
  TEMPLATES_QUERY,
  TemplateRecord,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  seedTemplates,
  isAdmin
} from "@/lib/templates";
import { uploadTemplateImage } from "@/lib/storage";

export default function AdminPage() {
  const router = useRouter();
  const { isLoading: authLoading, user } = db.useAuth();
  const { isLoading: templatesLoading, data } = db.useQuery(TEMPLATES_QUERY);

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newName, setNewName] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const templates = (data?.templates ?? []) as TemplateRecord[];

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

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select an image file");
      return;
    }

    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  }

  function closeDialog() {
    setShowAddDialog(false);
    setNewName("");
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  async function handleAddTemplate() {
    if (!selectedFile || !newName.trim()) return;

    setIsSubmitting(true);
    try {
      const upload = await uploadTemplateImage(selectedFile);
      await createTemplate({ name: newName.trim(), path: upload.url });
      closeDialog();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to upload template";
      alert(msg);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSeedTemplates() {
    if (templates.length > 0) {
      const confirmed = window.confirm(
        "Templates already exist. Seeding will add duplicates. Continue?"
      );
      if (!confirmed) return;
    }

    setIsSubmitting(true);
    try {
      await seedTemplates();
    } finally {
      setIsSubmitting(false);
    }
  }

  function startEditing(template: TemplateRecord) {
    setEditingId(template.id);
    setEditName(template.name ?? "");
  }

  function cancelEditing() {
    setEditingId(null);
    setEditName("");
  }

  async function handleSaveEdit() {
    if (!editingId || !editName.trim()) return;

    setIsSubmitting(true);
    try {
      await updateTemplate(editingId, { name: editName.trim() });
      cancelEditing();
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(templateId: string) {
    setIsSubmitting(true);
    try {
      await deleteTemplate(templateId);
      setDeleteConfirmId(null);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="app" style={{ maxWidth: "900px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div>
          <h1 style={{ margin: "0 0 0.25rem", fontSize: "1.5rem", fontWeight: 700 }}>
            Template Management
          </h1>
          <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "0.9rem" }}>
            Manage meme templates available to all users
          </p>
        </div>
        <button
          onClick={() => setShowAddDialog(true)}
          style={{
            padding: "0.65rem 1.25rem",
            background: "var(--accent)",
            border: "none",
            borderRadius: "var(--radius-sm)",
            color: "#fff",
            fontSize: "0.9rem",
            fontWeight: 700,
            cursor: "pointer"
          }}
        >
          + Add Template
        </button>
      </div>

      <div
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius)",
          padding: "1.25rem"
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <h2 style={{ margin: 0, fontSize: "0.9rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Templates ({templates.length})
          </h2>
          {templates.length === 0 && (
            <button
              onClick={handleSeedTemplates}
              disabled={isSubmitting}
              style={{
                padding: "0.5rem 1rem",
                background: "var(--success)",
                border: "none",
                borderRadius: "var(--radius-sm)",
                color: "#fff",
                fontSize: "0.85rem",
                fontWeight: 600,
                cursor: isSubmitting ? "not-allowed" : "pointer",
                opacity: isSubmitting ? 0.6 : 1
              }}
            >
              Seed Default Templates
            </button>
          )}
        </div>

        {templatesLoading ? (
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>Loading templates...</p>
        ) : templates.length === 0 ? (
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
            No templates yet. Click &quot;Add Template&quot; or seed the defaults.
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {templates
              .sort((a, b) => (a.createdAt ?? 0) - (b.createdAt ?? 0))
              .map((template) => (
                <div
                  key={template.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "1rem",
                    padding: "0.75rem",
                    background: "var(--surface-raised)",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius-sm)"
                  }}
                >
                  <div
                    style={{
                      width: "60px",
                      height: "60px",
                      flexShrink: 0,
                      borderRadius: "6px",
                      overflow: "hidden",
                      background: "var(--bg)"
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={template.path}
                      alt={template.name}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  </div>

                  {editingId === template.id ? (
                    <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        style={{
                          flex: 1,
                          padding: "0.5rem 0.75rem",
                          background: "var(--bg)",
                          border: "1px solid var(--border)",
                          borderRadius: "6px",
                          color: "var(--text)",
                          fontSize: "0.85rem"
                        }}
                      />
                      <button
                        onClick={handleSaveEdit}
                        disabled={isSubmitting}
                        style={{
                          padding: "0.4rem 0.75rem",
                          background: "var(--success)",
                          border: "none",
                          borderRadius: "6px",
                          color: "#fff",
                          fontSize: "0.8rem",
                          fontWeight: 600,
                          cursor: "pointer"
                        }}
                      >
                        Save
                      </button>
                      <button
                        onClick={cancelEditing}
                        style={{
                          padding: "0.4rem 0.75rem",
                          background: "transparent",
                          border: "1px solid var(--border)",
                          borderRadius: "6px",
                          color: "var(--text)",
                          fontSize: "0.8rem",
                          cursor: "pointer"
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: 0, fontWeight: 600, fontSize: "0.95rem" }}>
                          {template.name}
                        </p>
                      </div>

                      <div style={{ display: "flex", gap: "0.5rem", flexShrink: 0 }}>
                        <button
                          onClick={() => startEditing(template)}
                          style={{
                            padding: "0.4rem 0.75rem",
                            background: "transparent",
                            border: "1px solid var(--border)",
                            borderRadius: "6px",
                            color: "var(--text)",
                            fontSize: "0.8rem",
                            cursor: "pointer"
                          }}
                        >
                          Edit
                        </button>
                        {deleteConfirmId === template.id ? (
                          <>
                            <button
                              onClick={() => handleDelete(template.id)}
                              disabled={isSubmitting}
                              style={{
                                padding: "0.4rem 0.75rem",
                                background: "var(--danger)",
                                border: "none",
                                borderRadius: "6px",
                                color: "#fff",
                                fontSize: "0.8rem",
                                fontWeight: 600,
                                cursor: "pointer"
                              }}
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => setDeleteConfirmId(null)}
                              style={{
                                padding: "0.4rem 0.75rem",
                                background: "transparent",
                                border: "1px solid var(--border)",
                                borderRadius: "6px",
                                color: "var(--text)",
                                fontSize: "0.8rem",
                                cursor: "pointer"
                              }}
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirmId(template.id)}
                            style={{
                              padding: "0.4rem 0.75rem",
                              background: "transparent",
                              border: "1px solid var(--danger)",
                              borderRadius: "6px",
                              color: "var(--danger)",
                              fontSize: "0.8rem",
                              cursor: "pointer"
                            }}
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              ))}
          </div>
        )}
      </div>

      {showAddDialog && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) closeDialog();
          }}
        >
          <div
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius)",
              padding: "1.5rem",
              width: "100%",
              maxWidth: "400px",
              boxShadow: "var(--shadow)"
            }}
          >
            <h2 style={{ margin: "0 0 1rem", fontSize: "1.25rem", fontWeight: 700 }}>
              Add New Template
            </h2>

            <div style={{ marginBottom: "1rem" }}>
              <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.85rem", color: "var(--text-muted)" }}>
                Template Image
              </label>
              {previewUrl ? (
                <div style={{ position: "relative", marginBottom: "0.5rem" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={previewUrl}
                    alt="Preview"
                    style={{
                      width: "100%",
                      maxHeight: "200px",
                      objectFit: "contain",
                      borderRadius: "6px",
                      background: "var(--bg)"
                    }}
                  />
                  <button
                    onClick={() => {
                      setSelectedFile(null);
                      if (previewUrl) URL.revokeObjectURL(previewUrl);
                      setPreviewUrl(null);
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                    style={{
                      position: "absolute",
                      top: "0.5rem",
                      right: "0.5rem",
                      width: "24px",
                      height: "24px",
                      borderRadius: "50%",
                      background: "var(--danger)",
                      border: "none",
                      color: "#fff",
                      fontSize: "1rem",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center"
                    }}
                  >
                    ×
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    width: "100%",
                    padding: "2rem",
                    background: "var(--bg)",
                    border: "2px dashed var(--border)",
                    borderRadius: "6px",
                    color: "var(--text-muted)",
                    fontSize: "0.9rem",
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "0.5rem"
                  }}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                  Browse for image
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                style={{ display: "none" }}
              />
            </div>

            <div style={{ marginBottom: "1.5rem" }}>
              <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.85rem", color: "var(--text-muted)" }}>
                Template Name
              </label>
              <input
                type="text"
                placeholder="e.g. Drake Hotline Bling"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.65rem 0.85rem",
                  background: "var(--bg)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-sm)",
                  color: "var(--text)",
                  fontSize: "0.9rem"
                }}
              />
            </div>

            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
              <button
                onClick={closeDialog}
                style={{
                  padding: "0.65rem 1rem",
                  background: "transparent",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-sm)",
                  color: "var(--text)",
                  fontSize: "0.9rem",
                  cursor: "pointer"
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleAddTemplate}
                disabled={isSubmitting || !selectedFile || !newName.trim()}
                style={{
                  padding: "0.65rem 1.25rem",
                  background: "var(--accent)",
                  border: "none",
                  borderRadius: "var(--radius-sm)",
                  color: "#fff",
                  fontSize: "0.9rem",
                  fontWeight: 700,
                  cursor: isSubmitting || !selectedFile || !newName.trim() ? "not-allowed" : "pointer",
                  opacity: isSubmitting || !selectedFile || !newName.trim() ? 0.6 : 1
                }}
              >
                {isSubmitting ? "Uploading..." : "Save Template"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
