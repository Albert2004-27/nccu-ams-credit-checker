import { describe, expect, it } from "vitest";
import { getAuditEligibilityLabel, getStatusTone } from "./status";

describe("status helpers", () => {
  it("maps audit eligibility to readable Traditional Chinese labels", () => {
    expect(getAuditEligibilityLabel(true)).toBe("符合畢業資格");
    expect(getAuditEligibilityLabel(false)).toBe("尚未符合畢業資格");
  });

  it("maps backend course status values to visual tones", () => {
    expect(getStatusTone("PASSED")).toBe("success");
    expect(getStatusTone("FAILED")).toBe("danger");
    expect(getStatusTone("WITHDRAWN")).toBe("muted");
    expect(getStatusTone("IN_PROGRESS")).toBe("info");
  });
});
