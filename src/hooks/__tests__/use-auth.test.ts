import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor, cleanup } from "@testing-library/react";
import { useAuth } from "../use-auth";
import { signIn as signInAction, signUp as signUpAction } from "@/actions";
import { getAnonWorkData, clearAnonWork } from "@/lib/anon-work-tracker";
import { getProjects } from "@/actions/get-projects";
import { createProject } from "@/actions/create-project";
import type { AuthResult } from "@/actions";

// Mock dependencies
vi.mock("next/navigation", () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
  })),
}));

vi.mock("@/actions", () => ({
  signIn: vi.fn(),
  signUp: vi.fn(),
}));

vi.mock("@/lib/anon-work-tracker", () => ({
  getAnonWorkData: vi.fn(),
  clearAnonWork: vi.fn(),
}));

vi.mock("@/actions/get-projects", () => ({
  getProjects: vi.fn(),
}));

vi.mock("@/actions/create-project", () => ({
  createProject: vi.fn(),
}));

describe("useAuth", () => {
  let mockRouter: any;

  beforeEach(async () => {
    vi.clearAllMocks();

    // Get the mocked useRouter
    const { useRouter } = await import("next/navigation");
    mockRouter = {
      push: vi.fn(),
    };
    (useRouter as any).mockReturnValue(mockRouter);
  });

  afterEach(() => {
    cleanup();
  });

  describe("initialization", () => {
    test("returns initial state with signIn, signUp, and isLoading", () => {
      const { result } = renderHook(() => useAuth());

      expect(result.current).toHaveProperty("signIn");
      expect(result.current).toHaveProperty("signUp");
      expect(result.current).toHaveProperty("isLoading");
      expect(typeof result.current.signIn).toBe("function");
      expect(typeof result.current.signUp).toBe("function");
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe("signIn", () => {
    test("successfully signs in and navigates with anonymous work", async () => {
      const mockAnonWork = {
        messages: [{ id: "1", role: "user", content: "Test message" }],
        fileSystemData: { "/App.jsx": { type: "file", content: "test" } },
      };
      const mockProject = { id: "project-123" };

      (signInAction as any).mockResolvedValue({ success: true });
      (getAnonWorkData as any).mockReturnValue(mockAnonWork);
      (createProject as any).mockResolvedValue(mockProject);

      const { result } = renderHook(() => useAuth());

      expect(result.current.isLoading).toBe(false);

      const authResult = await result.current.signIn("test@example.com", "password123");

      expect(signInAction).toHaveBeenCalledWith("test@example.com", "password123");
      expect(authResult).toEqual({ success: true });
      expect(getAnonWorkData).toHaveBeenCalled();
      expect(createProject).toHaveBeenCalledWith({
        name: expect.stringContaining("Design from"),
        messages: mockAnonWork.messages,
        data: mockAnonWork.fileSystemData,
      });
      expect(clearAnonWork).toHaveBeenCalled();
      expect(mockRouter.push).toHaveBeenCalledWith("/project-123");
      expect(result.current.isLoading).toBe(false);
    });

    test("successfully signs in and navigates to most recent project", async () => {
      const mockProjects = [
        { id: "project-1", name: "Recent Project" },
        { id: "project-2", name: "Older Project" },
      ];

      (signInAction as any).mockResolvedValue({ success: true });
      (getAnonWorkData as any).mockReturnValue(null);
      (getProjects as any).mockResolvedValue(mockProjects);

      const { result } = renderHook(() => useAuth());

      const authResult = await result.current.signIn("test@example.com", "password123");

      expect(authResult).toEqual({ success: true });
      expect(getProjects).toHaveBeenCalled();
      expect(mockRouter.push).toHaveBeenCalledWith("/project-1");
      expect(createProject).not.toHaveBeenCalled();
    });

    test("successfully signs in and creates new project when no projects exist", async () => {
      const mockProject = { id: "new-project-123" };

      (signInAction as any).mockResolvedValue({ success: true });
      (getAnonWorkData as any).mockReturnValue(null);
      (getProjects as any).mockResolvedValue([]);
      (createProject as any).mockResolvedValue(mockProject);

      const { result } = renderHook(() => useAuth());

      const authResult = await result.current.signIn("test@example.com", "password123");

      expect(authResult).toEqual({ success: true });
      expect(getProjects).toHaveBeenCalled();
      expect(createProject).toHaveBeenCalledWith({
        name: expect.stringMatching(/^New Design #\d+$/),
        messages: [],
        data: {},
      });
      expect(mockRouter.push).toHaveBeenCalledWith("/new-project-123");
    });

    test("handles sign-in failure and does not navigate", async () => {
      const errorResult: AuthResult = {
        success: false,
        error: "Invalid credentials",
      };

      (signInAction as any).mockResolvedValue(errorResult);

      const { result } = renderHook(() => useAuth());

      const authResult = await result.current.signIn("test@example.com", "wrongpassword");

      expect(authResult).toEqual(errorResult);
      expect(mockRouter.push).not.toHaveBeenCalled();
      expect(getAnonWorkData).not.toHaveBeenCalled();
      expect(result.current.isLoading).toBe(false);
    });

    test("sets loading state correctly during sign-in", async () => {
      let resolveSignIn: any;
      const signInPromise = new Promise<AuthResult>((resolve) => {
        resolveSignIn = resolve;
      });

      (signInAction as any).mockReturnValue(signInPromise);
      (getAnonWorkData as any).mockReturnValue(null);
      (getProjects as any).mockResolvedValue([{ id: "project-1" }]);

      const { result } = renderHook(() => useAuth());

      expect(result.current.isLoading).toBe(false);

      const promise = result.current.signIn("test@example.com", "password123");

      await waitFor(() => {
        expect(result.current.isLoading).toBe(true);
      });

      resolveSignIn({ success: true });
      await promise;

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });

    test("resets loading state even when sign-in throws error", async () => {
      (signInAction as any).mockRejectedValue(new Error("Network error"));

      const { result } = renderHook(() => useAuth());

      await expect(result.current.signIn("test@example.com", "password123")).rejects.toThrow(
        "Network error"
      );

      expect(result.current.isLoading).toBe(false);
    });

    test("handles anonymous work with empty messages array", async () => {
      const mockAnonWork = {
        messages: [],
        fileSystemData: {},
      };
      const mockProjects = [{ id: "project-1" }];

      (signInAction as any).mockResolvedValue({ success: true });
      (getAnonWorkData as any).mockReturnValue(mockAnonWork);
      (getProjects as any).mockResolvedValue(mockProjects);

      const { result } = renderHook(() => useAuth());

      await result.current.signIn("test@example.com", "password123");

      // Should skip creating project for empty anon work
      expect(createProject).not.toHaveBeenCalled();
      expect(getProjects).toHaveBeenCalled();
      expect(mockRouter.push).toHaveBeenCalledWith("/project-1");
    });
  });

  describe("signUp", () => {
    test("successfully signs up and navigates with anonymous work", async () => {
      const mockAnonWork = {
        messages: [{ id: "1", role: "user", content: "Test" }],
        fileSystemData: { "/App.jsx": { type: "file", content: "code" } },
      };
      const mockProject = { id: "signup-project-123" };

      (signUpAction as any).mockResolvedValue({ success: true });
      (getAnonWorkData as any).mockReturnValue(mockAnonWork);
      (createProject as any).mockResolvedValue(mockProject);

      const { result } = renderHook(() => useAuth());

      const authResult = await result.current.signUp("newuser@example.com", "password123");

      expect(signUpAction).toHaveBeenCalledWith("newuser@example.com", "password123");
      expect(authResult).toEqual({ success: true });
      expect(createProject).toHaveBeenCalledWith({
        name: expect.stringContaining("Design from"),
        messages: mockAnonWork.messages,
        data: mockAnonWork.fileSystemData,
      });
      expect(clearAnonWork).toHaveBeenCalled();
      expect(mockRouter.push).toHaveBeenCalledWith("/signup-project-123");
    });

    test("successfully signs up and navigates to most recent project", async () => {
      const mockProjects = [{ id: "existing-project" }];

      (signUpAction as any).mockResolvedValue({ success: true });
      (getAnonWorkData as any).mockReturnValue(null);
      (getProjects as any).mockResolvedValue(mockProjects);

      const { result } = renderHook(() => useAuth());

      const authResult = await result.current.signUp("newuser@example.com", "password123");

      expect(authResult).toEqual({ success: true });
      expect(mockRouter.push).toHaveBeenCalledWith("/existing-project");
    });

    test("successfully signs up and creates new project when no projects exist", async () => {
      const mockProject = { id: "first-project" };

      (signUpAction as any).mockResolvedValue({ success: true });
      (getAnonWorkData as any).mockReturnValue(null);
      (getProjects as any).mockResolvedValue([]);
      (createProject as any).mockResolvedValue(mockProject);

      const { result } = renderHook(() => useAuth());

      await result.current.signUp("newuser@example.com", "password123");

      expect(createProject).toHaveBeenCalledWith({
        name: expect.stringMatching(/^New Design #\d+$/),
        messages: [],
        data: {},
      });
      expect(mockRouter.push).toHaveBeenCalledWith("/first-project");
    });

    test("handles sign-up failure and does not navigate", async () => {
      const errorResult: AuthResult = {
        success: false,
        error: "Email already registered",
      };

      (signUpAction as any).mockResolvedValue(errorResult);

      const { result } = renderHook(() => useAuth());

      const authResult = await result.current.signUp("existing@example.com", "password123");

      expect(authResult).toEqual(errorResult);
      expect(mockRouter.push).not.toHaveBeenCalled();
      expect(getAnonWorkData).not.toHaveBeenCalled();
      expect(result.current.isLoading).toBe(false);
    });

    test("sets loading state correctly during sign-up", async () => {
      let resolveSignUp: any;
      const signUpPromise = new Promise<AuthResult>((resolve) => {
        resolveSignUp = resolve;
      });

      (signUpAction as any).mockReturnValue(signUpPromise);
      (getAnonWorkData as any).mockReturnValue(null);
      (getProjects as any).mockResolvedValue([{ id: "project-1" }]);

      const { result } = renderHook(() => useAuth());

      expect(result.current.isLoading).toBe(false);

      const promise = result.current.signUp("newuser@example.com", "password123");

      await waitFor(() => {
        expect(result.current.isLoading).toBe(true);
      });

      resolveSignUp({ success: true });
      await promise;

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });

    test("resets loading state even when sign-up throws error", async () => {
      (signUpAction as any).mockRejectedValue(new Error("Database error"));

      const { result } = renderHook(() => useAuth());

      await expect(
        result.current.signUp("newuser@example.com", "password123")
      ).rejects.toThrow("Database error");

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe("edge cases", () => {
    test("handles createProject failure during post-signin with anon work", async () => {
      const mockAnonWork = {
        messages: [{ id: "1", role: "user", content: "Test" }],
        fileSystemData: {},
      };

      (signInAction as any).mockResolvedValue({ success: true });
      (getAnonWorkData as any).mockReturnValue(mockAnonWork);
      (createProject as any).mockRejectedValue(new Error("Project creation failed"));

      const { result } = renderHook(() => useAuth());

      await expect(result.current.signIn("test@example.com", "password123")).rejects.toThrow(
        "Project creation failed"
      );

      expect(result.current.isLoading).toBe(false);
    });

    test("handles getProjects failure during post-signin", async () => {
      (signInAction as any).mockResolvedValue({ success: true });
      (getAnonWorkData as any).mockReturnValue(null);
      (getProjects as any).mockRejectedValue(new Error("Failed to fetch projects"));

      const { result } = renderHook(() => useAuth());

      await expect(result.current.signIn("test@example.com", "password123")).rejects.toThrow(
        "Failed to fetch projects"
      );

      expect(result.current.isLoading).toBe(false);
    });

    test("generates unique project name with random number", async () => {
      (signUpAction as any).mockResolvedValue({ success: true });
      (getAnonWorkData as any).mockReturnValue(null);
      (getProjects as any).mockResolvedValue([]);
      (createProject as any).mockResolvedValue({ id: "test" });

      const { result } = renderHook(() => useAuth());

      await result.current.signUp("test@example.com", "password123");

      expect(createProject).toHaveBeenCalledWith({
        name: expect.stringMatching(/^New Design #\d+$/),
        messages: [],
        data: {},
      });

      const call = (createProject as any).mock.calls[0][0];
      const numberPart = parseInt(call.name.replace("New Design #", ""));
      expect(numberPart).toBeGreaterThanOrEqual(0);
      expect(numberPart).toBeLessThan(100000);
    });

    test("generates timestamp-based project name for anonymous work", async () => {
      const mockAnonWork = {
        messages: [{ id: "1", role: "user", content: "Test" }],
        fileSystemData: {},
      };

      (signInAction as any).mockResolvedValue({ success: true });
      (getAnonWorkData as any).mockReturnValue(mockAnonWork);
      (createProject as any).mockResolvedValue({ id: "test" });

      const { result } = renderHook(() => useAuth());

      await result.current.signIn("test@example.com", "password123");

      expect(createProject).toHaveBeenCalledWith({
        name: expect.stringContaining("Design from"),
        messages: mockAnonWork.messages,
        data: mockAnonWork.fileSystemData,
      });

      const call = (createProject as any).mock.calls[0][0];
      expect(call.name).toMatch(/^Design from \d{1,2}:\d{2}:\d{2}/);
    });
  });

  describe("sequential operations", () => {
    test("can call signIn multiple times sequentially", async () => {
      (signInAction as any)
        .mockResolvedValueOnce({ success: false, error: "Wrong password" })
        .mockResolvedValueOnce({ success: true });
      (getAnonWorkData as any).mockReturnValue(null);
      (getProjects as any).mockResolvedValue([{ id: "project-1" }]);

      const { result } = renderHook(() => useAuth());

      const firstResult = await result.current.signIn("test@example.com", "wrong");
      expect(firstResult.success).toBe(false);
      expect(mockRouter.push).not.toHaveBeenCalled();

      const secondResult = await result.current.signIn("test@example.com", "correct");
      expect(secondResult.success).toBe(true);
      expect(mockRouter.push).toHaveBeenCalledWith("/project-1");
    });

    test("can call signUp then signIn", async () => {
      (signUpAction as any).mockResolvedValue({ success: true });
      (signInAction as any).mockResolvedValue({ success: true });
      (getAnonWorkData as any).mockReturnValue(null);
      (getProjects as any).mockResolvedValue([{ id: "project-1" }]);

      const { result } = renderHook(() => useAuth());

      await result.current.signUp("new@example.com", "password123");
      expect(mockRouter.push).toHaveBeenCalledWith("/project-1");

      mockRouter.push.mockClear();

      await result.current.signIn("new@example.com", "password123");
      expect(mockRouter.push).toHaveBeenCalledWith("/project-1");
    });
  });
});
