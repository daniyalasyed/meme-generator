import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("@instantdb/react", () => ({
  id: () => "mock-id",
  init: () => ({
    transact: vi.fn(),
    tx: {},
  }),
}));

vi.mock("@/lib/instant", () => ({
  db: {
    transact: vi.fn(),
    tx: {
      templates: new Proxy({}, {
        get: () => ({
          update: vi.fn(),
          delete: vi.fn(),
        }),
      }),
    },
  },
}));

describe("isAdmin", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("returns true when email matches ADMIN_EMAIL", async () => {
    process.env.NEXT_PUBLIC_ADMIN_EMAIL = "admin@example.com";
    const { isAdmin } = await import("./templates");
    expect(isAdmin("admin@example.com")).toBe(true);
  });

  it("returns false when email does not match", async () => {
    process.env.NEXT_PUBLIC_ADMIN_EMAIL = "admin@example.com";
    const { isAdmin } = await import("./templates");
    expect(isAdmin("user@example.com")).toBe(false);
  });

  it("returns false for null email", async () => {
    process.env.NEXT_PUBLIC_ADMIN_EMAIL = "admin@example.com";
    const { isAdmin } = await import("./templates");
    expect(isAdmin(null)).toBe(false);
  });

  it("returns false for undefined email", async () => {
    process.env.NEXT_PUBLIC_ADMIN_EMAIL = "admin@example.com";
    const { isAdmin } = await import("./templates");
    expect(isAdmin(undefined)).toBe(false);
  });

  it("returns false when ADMIN_EMAIL is not set", async () => {
    delete process.env.NEXT_PUBLIC_ADMIN_EMAIL;
    const { isAdmin } = await import("./templates");
    expect(isAdmin("any@example.com")).toBe(false);
  });
});
