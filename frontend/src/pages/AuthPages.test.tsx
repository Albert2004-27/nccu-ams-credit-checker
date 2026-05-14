import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LoginPage } from "./AuthPages";

vi.mock("../state/AppState", () => ({
  useAppState: () => ({
    setRole: vi.fn(),
    setCurrentUser: vi.fn()
  })
}));

afterEach(() => {
  cleanup();
});

describe("LoginPage", () => {
  it("uses the Mathematical Sciences department label", () => {
    render(<MemoryRouter><LoginPage /></MemoryRouter>);

    expect(screen.getByText("Mathematical Sciences")).toBeInTheDocument();
    expect(screen.queryByText("Applied Mathematics")).not.toBeInTheDocument();
  });
});
