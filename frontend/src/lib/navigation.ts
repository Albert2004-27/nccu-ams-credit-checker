import type { UserRole } from "../types/api";

export function getDefaultRouteForRole(role: UserRole) {
  return role === "admin" ? "/admin" : "/student";
}

export function isAdminRouteAllowed(role: UserRole) {
  return role === "admin";
}
