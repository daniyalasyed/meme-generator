"use client";

import { id } from "@instantdb/react";
import { db } from "@/lib/instant";
import { ADMIN_EMAIL } from "@/lib/constants";

export { ADMIN_EMAIL };

export type TemplateRecord = {
  id: string;
  name?: string;
  path?: string;
  createdAt?: number;
};

export const TEMPLATES_QUERY = {
  templates: {}
};

export const DEFAULT_TEMPLATES = [
  { path: "/templates/drake.jpg", name: "Drake Hotline Bling" },
  { path: "/templates/thinking.jpg", name: "I Bet He's Thinking About Other Women" },
  { path: "/templates/two-buttons.jpg", name: "Two Buttons" }
];

export async function createTemplate(input: {
  name: string;
  path: string;
}): Promise<void> {
  const templateId = id();
  await db.transact(
    db.tx.templates[templateId].update({
      name: input.name,
      path: input.path,
      createdAt: Date.now()
    })
  );
}

export async function updateTemplate(
  templateId: string,
  updates: { name?: string; path?: string }
): Promise<void> {
  await db.transact(db.tx.templates[templateId].update(updates));
}

export async function deleteTemplate(templateId: string): Promise<void> {
  await db.transact(db.tx.templates[templateId].delete());
}

export async function seedTemplates(): Promise<void> {
  const txns = DEFAULT_TEMPLATES.map((template) => {
    const templateId = id();
    return db.tx.templates[templateId].update({
      name: template.name,
      path: template.path,
      createdAt: Date.now()
    });
  });
  await db.transact(txns);
}

export function isAdmin(email?: string | null): boolean {
  return email === ADMIN_EMAIL;
}
