import { describe, expect, it } from "vitest";
import { getDefaultRouteForRole, isAdminRouteAllowed } from "./navigation";

describe("role navigation", () => {
  it("routes students and admins to their own dashboards", () => {
    expect(getDefaultRouteForRole("student")).toBe("/student");
    expect(getDefaultRouteForRole("admin")).toBe("/admin");
  });

  it("keeps student users out of admin routes", () => {
    expect(isAdminRouteAllowed("student")).toBe(false);
    expect(isAdminRouteAllowed("admin")).toBe(true);
  });
});
