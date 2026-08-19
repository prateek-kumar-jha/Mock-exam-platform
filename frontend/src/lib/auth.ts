/**
 * Client-side auth helpers.
 *
 * NOTE: tokens are kept in localStorage for now, which is readable by any
 * script on the page (XSS-exposed). This is a deliberate interim choice —
 * revisit with httpOnly cookies before launch.
 */

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

const ACCESS_TOKEN_KEY = "eduspark.accessToken";
const REFRESH_TOKEN_KEY = "eduspark.refreshToken";

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

export type SignupPayload = {
  email: string;
  password: string;
  name: string;
};

export type LoginPayload = {
  email: string;
  password: string;
};

/**
 * Pulls a human-readable message out of a NestJS error body.
 *
 * Nest returns `message` as a string for thrown exceptions (401/409) but as a
 * string[] when the ValidationPipe rejects a field, so both shapes are handled.
 */
function extractErrorMessage(body: unknown, status: number): string {
  // Rate-limit replies carry the framework's exception class name
  // ("ThrottlerException: Too Many Requests"), which is an internal detail
  // no student should see — always substitute our own wording.
  if (status === 429) {
    return "Too many attempts. Please wait a moment and try again.";
  }

  if (body && typeof body === "object" && "message" in body) {
    const { message } = body as { message: unknown };

    if (typeof message === "string" && message.trim() !== "") {
      return message;
    }
    if (Array.isArray(message) && message.length > 0) {
      return message.join(", ");
    }
  }

  // Fall back to something actionable rather than a bare status code.
  return `Request failed (${status}). Please try again.`;
}

async function postAuth<T extends object>(
  path: string,
  payload: T,
): Promise<AuthTokens> {
  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch {
    // fetch only rejects on network-level failure, not on HTTP error status.
    throw new Error(
      "Could not reach the server. Check that the backend is running.",
    );
  }

  const body = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(extractErrorMessage(body, response.status));
  }

  return body as AuthTokens;
}

export function signup(payload: SignupPayload): Promise<AuthTokens> {
  return postAuth("/auth/signup", payload);
}

export function login(payload: LoginPayload): Promise<AuthTokens> {
  return postAuth("/auth/login", payload);
}

export function storeTokens(tokens: AuthTokens): void {
  localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
}

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function clearTokens(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}
