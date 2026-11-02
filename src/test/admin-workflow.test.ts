import { describe, it, expect } from "vitest";
import {
  getAdminEvaluationState,
  getManagerEvaluationState,
  type EvaluationStatus,
} from "@/lib/scoring";
import { saveLocalEvaluation, resetLocalStore, getLocalEvaluations } from "@/lib/localStore";

describe("3-State Admin Workflow & Action Permissions (PRD Section 4 & FR-04)", () => {
  describe("State Mapping for Admin (Dr. Sheetal)", () => {
    it("maps 'Submitted for review' to 'In Review'", () => {
      expect(getAdminEvaluationState("Submitted for review")).toBe("In Review");
    });

    it("maps 'Reviewed' to 'Approved'", () => {
      expect(getAdminEvaluationState("Reviewed")).toBe("Approved");
    });

    it("maps 'Locked/Finalized' to 'Approved'", () => {
      expect(getAdminEvaluationState("Locked/Finalized")).toBe("Approved");
    });

    it("maps 'Not started' to 'Pending'", () => {
      expect(getAdminEvaluationState("Not started")).toBe("Pending");
    });

    it("maps 'In progress' (Draft) to 'Pending'", () => {
      expect(getAdminEvaluationState("In progress")).toBe("Pending");
    });
  });

  describe("Granular State Mapping for Center Manager (Sandeep)", () => {
    it("maps 'In progress' to 'Draft'", () => {
      expect(getManagerEvaluationState("In progress")).toBe("Draft");
    });

    it("maps 'Submitted for review' to 'In Review'", () => {
      expect(getManagerEvaluationState("Submitted for review")).toBe("In Review");
    });

    it("maps 'Reviewed' to 'Approved'", () => {
      expect(getManagerEvaluationState("Reviewed")).toBe("Approved");
    });

    it("maps 'Locked/Finalized' to 'Approved'", () => {
      expect(getManagerEvaluationState("Locked/Finalized")).toBe("Approved");
    });

    it("maps 'Not started' to 'Pending'", () => {
      expect(getManagerEvaluationState("Not started")).toBe("Pending");
    });
  });

  describe("Lifecycle Flow: Staff/Manager Draft -> In Review -> Dr. Sheetal Approve & Finalize", () => {
    it("transitions an evaluation from Pending (Draft) to In Review, then to Approved (Locked/Finalized)", () => {
      resetLocalStore();

      // Step 1: Staff or Manager creates/edits draft -> In progress (Pending for Admin, Draft for Manager)
      const draft = saveLocalEvaluation({
        employee_id: "u-amit",
        month: "2026-10",
        status: "In progress",
        actuals: { k1: 150, k2: 90, k3: 88, k4: 1, k5: 3 },
        feedback: "Staff entering figures",
      });
      expect(draft.status).toBe("In progress");
      expect(getAdminEvaluationState(draft.status)).toBe("Pending");
      expect(getManagerEvaluationState(draft.status)).toBe("Draft");

      // Step 2: Submitted for Review (In Review for both Admin & Manager)
      const submitted = saveLocalEvaluation({
        employee_id: "u-amit",
        month: "2026-10",
        status: "Submitted for review",
        actuals: { k1: 160, k2: 95, k3: 92, k4: 0, k5: 2 },
        reviewer_id: "u-sandeep",
      });
      expect(submitted.status).toBe("Submitted for review");
      expect(getAdminEvaluationState(submitted.status)).toBe("In Review");
      expect(getManagerEvaluationState(submitted.status)).toBe("In Review");

      // Step 3: Admin (Dr. Sheetal) clicks "Approve & Finalize" -> Locked/Finalized (Approved for Admin & Manager)
      const finalized = saveLocalEvaluation({
        employee_id: "u-amit",
        month: "2026-10",
        status: "Locked/Finalized",
        actuals: { k1: 160, k2: 95, k3: 92, k4: 0, k5: 2 },
        reviewer_id: "u-sheetal",
        feedback: "Approved and finalized by Dr. Sheetal",
      });
      expect(finalized.status).toBe("Locked/Finalized");
      expect(getAdminEvaluationState(finalized.status)).toBe("Approved");
      expect(getManagerEvaluationState(finalized.status)).toBe("Approved");
      expect(finalized.timestamps.finalizedAt).toBeDefined();
    });
  });
});
