import { getAccessToken } from "./auth";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

export type ExamSummary = {
  id: string;
  name: string;
  category: string;
};

export type PackageSummary = {
  id: string;
  title: string;
  description: string | null;
  price: number;
  exams: ExamSummary[];
};

export type TestSummary = {
  id: string;
  title: string;
  duration_minutes: number;
  scheduled_start: string | null;
  scheduled_end: string | null;
  question_count: number;
  series: { id: string; title: string; type: string } | null;
  exam: ExamSummary | null;
};

/** Thrown with a user-safe message; callers render it directly. */
export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

async function authedGet<T>(path: string): Promise<T> {
  const token = getAccessToken();
  if (!token) {
    throw new ApiError("Your session has expired. Please log in again.", 401);
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch {
    throw new ApiError(
      "Could not reach the server. Check that the backend is running.",
      0,
    );
  }

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new ApiError(
        "Your session has expired. Please log in again.",
        response.status,
      );
    }
    if (response.status === 429) {
      throw new ApiError(
        "Too many requests. Please wait a moment and try again.",
        429,
      );
    }
    throw new ApiError("Could not load this content. Please try again.", response.status);
  }

  return (await response.json()) as T;
}

export function fetchPackages(): Promise<PackageSummary[]> {
  return authedGet<PackageSummary[]>("/api/v1/packages");
}

export function fetchTests(): Promise<TestSummary[]> {
  return authedGet<TestSummary[]>("/api/v1/tests");
}
