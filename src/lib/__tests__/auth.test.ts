import { describe, test, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("server-only", () => ({}));

const mockCookies = vi.hoisted(() => ({
  get: vi.fn(),
  set: vi.fn(),
  delete: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(() => mockCookies),
}));

const mockJose = vi.hoisted(() => ({
  SignJWT: vi.fn(),
  jwtVerify: vi.fn(),
}));

vi.mock("jose", () => mockJose);

import { createSession, getSession, deleteSession, verifySession } from "@/lib/auth";

describe("createSession", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
    test("creates a session with JWT token and sets cookie", async () => {
      const mockToken = "mock-jwt-token";
      const mockSetProtectedHeader = vi.fn().mockReturnThis();
      const mockSetExpirationTime = vi.fn().mockReturnThis();
      const mockSetIssuedAt = vi.fn().mockReturnThis();
      const mockSign = vi.fn().mockResolvedValue(mockToken);

      mockJose.SignJWT.mockImplementation(() => ({
        setProtectedHeader: mockSetProtectedHeader,
        setExpirationTime: mockSetExpirationTime,
        setIssuedAt: mockSetIssuedAt,
        sign: mockSign,
      }));

      await createSession("user-123", "test@example.com");

      expect(mockJose.SignJWT).toHaveBeenCalled();
      expect(mockSetProtectedHeader).toHaveBeenCalledWith({ alg: "HS256" });
      expect(mockSetExpirationTime).toHaveBeenCalledWith("7d");
      expect(mockSetIssuedAt).toHaveBeenCalled();
      expect(mockSign).toHaveBeenCalled();

      expect(mockCookies.set).toHaveBeenCalledWith(
        "auth-token",
        mockToken,
        expect.objectContaining({
          httpOnly: true,
          sameSite: "lax",
          path: "/",
        })
      );
    });

    test("sets secure flag in production", async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "production";

      const mockToken = "mock-jwt-token";
      mockJose.SignJWT.mockImplementation(() => ({
        setProtectedHeader: vi.fn().mockReturnThis(),
        setExpirationTime: vi.fn().mockReturnThis(),
        setIssuedAt: vi.fn().mockReturnThis(),
        sign: vi.fn().mockResolvedValue(mockToken),
      }));

      await createSession("user-123", "test@example.com");

      expect(mockCookies.set).toHaveBeenCalledWith(
        "auth-token",
        mockToken,
        expect.objectContaining({
          secure: true,
        })
      );

      process.env.NODE_ENV = originalEnv;
    });

    test("creates session with 7 day expiration", async () => {
      const mockToken = "mock-jwt-token";
      mockJose.SignJWT.mockImplementation(() => ({
        setProtectedHeader: vi.fn().mockReturnThis(),
        setExpirationTime: vi.fn().mockReturnThis(),
        setIssuedAt: vi.fn().mockReturnThis(),
        sign: vi.fn().mockResolvedValue(mockToken),
      }));

      const beforeTime = Date.now();
      await createSession("user-123", "test@example.com");
      const afterTime = Date.now();

      const setCookieCall = mockCookies.set.mock.calls[0];
      const cookieOptions = setCookieCall[2];
      const expiresTime = cookieOptions.expires.getTime();

      const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;
      expect(expiresTime).toBeGreaterThanOrEqual(beforeTime + sevenDaysInMs);
      expect(expiresTime).toBeLessThanOrEqual(afterTime + sevenDaysInMs);
    });
});

describe("getSession", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("returns session payload when valid token exists", async () => {
    const mockPayload = {
      userId: "user-123",
      email: "test@example.com",
      expiresAt: new Date(),
    };

    mockCookies.get.mockReturnValue({ value: "valid-token" });
    mockJose.jwtVerify.mockResolvedValue({ payload: mockPayload });

    const session = await getSession();

    expect(mockCookies.get).toHaveBeenCalledWith("auth-token");
    expect(mockJose.jwtVerify).toHaveBeenCalledWith(
      "valid-token",
      expect.any(Object)
    );
    expect(session).toEqual(mockPayload);
  });

  test("returns null when no token exists", async () => {
    mockCookies.get.mockReturnValue(undefined);

    const session = await getSession();

    expect(session).toBeNull();
    expect(mockJose.jwtVerify).not.toHaveBeenCalled();
  });

  test("returns null when token verification fails", async () => {
    mockCookies.get.mockReturnValue({ value: "invalid-token" });
    mockJose.jwtVerify.mockRejectedValue(new Error("Invalid token"));

    const session = await getSession();

    expect(session).toBeNull();
  });
});

describe("deleteSession", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("deletes the auth cookie", async () => {
    await deleteSession();

    expect(mockCookies.delete).toHaveBeenCalledWith("auth-token");
  });
});

describe("verifySession", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("returns session payload when valid token exists in request", async () => {
    const mockPayload = {
      userId: "user-123",
      email: "test@example.com",
      expiresAt: new Date(),
    };

    const mockRequest = {
      cookies: {
        get: vi.fn().mockReturnValue({ value: "valid-token" }),
      },
    } as unknown as NextRequest;

    mockJose.jwtVerify.mockResolvedValue({ payload: mockPayload });

    const session = await verifySession(mockRequest);

    expect(mockRequest.cookies.get).toHaveBeenCalledWith("auth-token");
    expect(mockJose.jwtVerify).toHaveBeenCalledWith(
      "valid-token",
      expect.any(Object)
    );
    expect(session).toEqual(mockPayload);
  });

  test("returns null when no token exists in request", async () => {
    const mockRequest = {
      cookies: {
        get: vi.fn().mockReturnValue(undefined),
      },
    } as unknown as NextRequest;

    const session = await verifySession(mockRequest);

    expect(session).toBeNull();
    expect(mockJose.jwtVerify).not.toHaveBeenCalled();
  });

  test("returns null when token verification fails", async () => {
    const mockRequest = {
      cookies: {
        get: vi.fn().mockReturnValue({ value: "invalid-token" }),
      },
    } as unknown as NextRequest;

    mockJose.jwtVerify.mockRejectedValue(new Error("Invalid token"));

    const session = await verifySession(mockRequest);

    expect(session).toBeNull();
  });
});
