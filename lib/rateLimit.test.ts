import { describe, it, expect, beforeEach, vi } from "vitest";
import { canRunAction } from "./rateLimit";

describe("canRunAction", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it("allows first action", () => {
    const key = "test-action-1";
    expect(canRunAction(key, 5, 60000)).toBe(true);
  });

  it("allows actions up to the limit", () => {
    const key = "test-action-2";
    const maxInWindow = 3;

    expect(canRunAction(key, maxInWindow, 60000)).toBe(true);
    expect(canRunAction(key, maxInWindow, 60000)).toBe(true);
    expect(canRunAction(key, maxInWindow, 60000)).toBe(true);
  });

  it("blocks actions over the limit", () => {
    const key = "test-action-3";
    const maxInWindow = 2;

    expect(canRunAction(key, maxInWindow, 60000)).toBe(true);
    expect(canRunAction(key, maxInWindow, 60000)).toBe(true);
    expect(canRunAction(key, maxInWindow, 60000)).toBe(false);
  });

  it("allows actions again after window expires", () => {
    const key = "test-action-4";
    const maxInWindow = 2;
    const windowMs = 60000;

    expect(canRunAction(key, maxInWindow, windowMs)).toBe(true);
    expect(canRunAction(key, maxInWindow, windowMs)).toBe(true);
    expect(canRunAction(key, maxInWindow, windowMs)).toBe(false);

    vi.advanceTimersByTime(windowMs + 1);

    expect(canRunAction(key, maxInWindow, windowMs)).toBe(true);
  });

  it("uses separate buckets for different keys", () => {
    const key1 = "user-1-action";
    const key2 = "user-2-action";
    const maxInWindow = 1;

    expect(canRunAction(key1, maxInWindow, 60000)).toBe(true);
    expect(canRunAction(key1, maxInWindow, 60000)).toBe(false);

    expect(canRunAction(key2, maxInWindow, 60000)).toBe(true);
    expect(canRunAction(key2, maxInWindow, 60000)).toBe(false);
  });

  it("sliding window removes old timestamps", () => {
    const key = "test-action-5";
    const maxInWindow = 2;
    const windowMs = 60000;

    expect(canRunAction(key, maxInWindow, windowMs)).toBe(true);

    vi.advanceTimersByTime(30000);
    expect(canRunAction(key, maxInWindow, windowMs)).toBe(true);
    expect(canRunAction(key, maxInWindow, windowMs)).toBe(false);

    vi.advanceTimersByTime(31000);
    expect(canRunAction(key, maxInWindow, windowMs)).toBe(true);
  });
});
