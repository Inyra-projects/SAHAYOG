import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Evaluations } from "@/components/kra/Evaluations";
import { getLocalBootstrap, resetLocalStore } from "@/lib/localStore";
import { setStoredUser } from "@/lib/auth";
import { SessionProvider } from "@/components/kra/session";
import { toast } from "sonner";

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

function renderWithSession(ui: React.ReactElement, userId: string) {
  const data = getLocalBootstrap(userId);
  setStoredUser(data.me);
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={qc}>
      <SessionProvider>{ui}</SessionProvider>
    </QueryClientProvider>
  );
}

describe("Evaluations Component: Admin vs Center Manager Views", () => {
  beforeEach(() => {
    resetLocalStore();
    vi.clearAllMocks();
  });

  describe("Admin View (Dr. Sheetal)", () => {
    it("does not render filter tabs above the search bar", () => {
      const data = getLocalBootstrap("u-sheetal");
      renderWithSession(<Evaluations data={data} />, "u-sheetal");

      // Verify no top filter tab buttons above search bar
      const searchInput = screen.getByPlaceholderText(/Search staff by name or ID/i);
      expect(searchInput).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /^All 7$/i })).not.toBeInTheDocument();
    });

    it("displays 'Review' for In Review cards, 'View' for Approved, and 'Remind' for Pending cards", () => {
      const data = getLocalBootstrap("u-sheetal");
      renderWithSession(<Evaluations data={data} />, "u-sheetal");

      // Priya, Sneha, Meera are 'Submitted for review' -> 'Review'
      const reviewButtons = screen.getAllByRole("button", { name: /Review evaluation for/i });
      expect(reviewButtons.length).toBe(3);
      expect(reviewButtons[0].textContent).toBe("Review");

      // Rohit, Amit, Nikhil, Anjali are Pending -> 'Remind' without icon
      const sendAlertButtons = screen.getAllByRole("button", { name: /^Remind /i });
      expect(sendAlertButtons.length).toBe(4);
      expect(sendAlertButtons[0].textContent?.trim()).toBe("Remind");
    });

    it("triggers toast alert when clicking 'Remind' on a Pending card", () => {
      const data = getLocalBootstrap("u-sheetal");
      renderWithSession(<Evaluations data={data} />, "u-sheetal");

      const sendAlertButtons = screen.getAllByRole("button", { name: /^Remind /i });
      fireEvent.click(sendAlertButtons[0]);

      expect(toast.success).toHaveBeenCalledWith("Reminder alert sent to staff");
    });

    it("filters employee list via filter sheet", () => {
      const data = getLocalBootstrap("u-sheetal");
      renderWithSession(<Evaluations data={data} />, "u-sheetal");

      // Open filter bottom sheet
      const filterButton = screen.getByRole("button", { name: /Filter evaluations/i });
      fireEvent.click(filterButton);

      // Click "In Review (3)" inside filter sheet
      const inReviewOption = screen.getByRole("button", { name: /In Review \(3\)/i });
      fireEvent.click(inReviewOption);

      // Apply
      const applyButton = screen.getByRole("button", { name: /Show 3 Staff Evaluations/i });
      fireEvent.click(applyButton);

      expect(screen.getAllByRole("button", { name: /Review evaluation for/i }).length).toBe(3);
      expect(screen.queryByRole("button", { name: /Send alert to/i })).not.toBeInTheDocument();
    });

    it("opens in-review drawer with 'Approve & Finalize' without icons", () => {
      const data = getLocalBootstrap("u-sheetal");
      renderWithSession(<Evaluations data={data} />, "u-sheetal");

      const reviewButtons = screen.getAllByRole("button", { name: /Review evaluation for/i });
      fireEvent.click(reviewButtons[0]);

      const approveButton = screen.getByRole("button", { name: /Approve & Finalize/i });
      expect(approveButton).toBeInTheDocument();
      expect(approveButton.querySelector("svg")).toBeNull();
    });
  });

  describe("Center Manager View (Sandeep Gaikwad)", () => {
    it("displays granular actions: Review, Continue, and Start for Manager", () => {
      const data = getLocalBootstrap("u-sandeep");
      renderWithSession(<Evaluations data={data} />, "u-sandeep");

      // In Review cards have "Review" button
      const reviewButtons = screen.getAllByRole("button", { name: /Open evaluation for/i }).filter((b) => b.textContent === "Review");
      expect(reviewButtons.length).toBe(3);

      // In progress cards have "Continue" button
      const continueButtons = screen.getAllByRole("button", { name: /Open evaluation for/i }).filter((b) => b.textContent === "Continue");
      expect(continueButtons.length).toBe(2);

      // Not started cards have "Start" button
      const startButtons = screen.getAllByRole("button", { name: /Open evaluation for/i }).filter((b) => b.textContent === "Start");
      expect(startButtons.length).toBe(2);
    });

    it("filters properly in filter sheet with granular states for Manager", () => {
      const data = getLocalBootstrap("u-sandeep");
      renderWithSession(<Evaluations data={data} />, "u-sandeep");

      // Open filter bottom sheet
      const filterButton = screen.getByRole("button", { name: /Filter evaluations/i });
      fireEvent.click(filterButton);

      expect(screen.getByRole("button", { name: /Draft \(2\)/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /In Review \(3\)/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Pending \(2\)/i })).toBeInTheDocument();
    });

    it("in-review card has 'Submit Evaluation' without icon and NO 'Send Back for Correction' button", () => {
      const data = getLocalBootstrap("u-sandeep");
      renderWithSession(<Evaluations data={data} />, "u-sandeep");

      // Open an In Review card (Priya)
      const reviewButtons = screen.getAllByRole("button", { name: /Open evaluation for/i }).filter((b) => b.textContent === "Review");
      fireEvent.click(reviewButtons[0]);

      // Verify 'Submit Evaluation' primary button is present without icon
      const submitBtn = screen.getByRole("button", { name: /^Submit Evaluation$/i });
      expect(submitBtn).toBeInTheDocument();
      expect(submitBtn.querySelector("svg")).toBeNull();

      // Verify 'Send Back for Correction' is NOT rendered
      expect(screen.queryByRole("button", { name: /Send Back for Correction/i })).not.toBeInTheDocument();
    });
  });
});
