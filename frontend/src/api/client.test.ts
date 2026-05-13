import { describe, expect, it } from "vitest";
import { buildApiUrl } from "./client";

describe("buildApiUrl", () => {
  it("uses relative API paths when the configured base URL is empty", () => {
    expect(buildApiUrl("/api/health", "")).toBe("/api/health");
  });

  it("joins absolute API base URLs without duplicate slashes", () => {
    expect(buildApiUrl("/api/health", "https://example.com/")).toBe("https://example.com/api/health");
  });
});
