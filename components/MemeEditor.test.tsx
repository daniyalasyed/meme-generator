import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemeEditor } from "./MemeEditor";

vi.mock("@instantdb/react", () => ({
  id: () => "mock-id",
}));

const mockTemplates = [
  { path: "/templates/drake.jpg", name: "Drake" },
  { path: "/templates/thinking.jpg", name: "Thinking" },
];

describe("MemeEditor", () => {
  const defaultProps = {
    canPost: true,
    isPosting: false,
    onPost: vi.fn(),
    templates: mockTemplates,
    templatesLoading: false,
  };

  it("renders template selector", () => {
    render(<MemeEditor {...defaultProps} />);
    expect(screen.getByText("Choose a template")).toBeInTheDocument();
  });

  it("renders template thumbnails", () => {
    render(<MemeEditor {...defaultProps} />);
    const thumbnails = screen.getAllByRole("button", { name: /Drake|Thinking/i });
    expect(thumbnails).toHaveLength(2);
  });

  it("shows loading state when templates are loading", () => {
    render(<MemeEditor {...defaultProps} templatesLoading={true} templates={[]} />);
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("shows empty state when no templates available", () => {
    render(<MemeEditor {...defaultProps} templates={[]} />);
    expect(screen.getByText("No templates")).toBeInTheDocument();
  });

  it("renders canvas placeholder when no image selected", () => {
    render(<MemeEditor {...defaultProps} />);
    expect(screen.getByText("Select a template or upload an image")).toBeInTheDocument();
  });

  it("renders upload button", () => {
    render(<MemeEditor {...defaultProps} />);
    expect(screen.getByText("or upload your own template")).toBeInTheDocument();
  });

  it("has file input for image upload", () => {
    render(<MemeEditor {...defaultProps} />);
    const fileInput = document.getElementById("imageInput") as HTMLInputElement;
    expect(fileInput).toBeInTheDocument();
    expect(fileInput.type).toBe("file");
    expect(fileInput.accept).toBe("image/*");
  });
});
