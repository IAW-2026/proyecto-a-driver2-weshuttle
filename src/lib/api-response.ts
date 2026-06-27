import { NextResponse } from "next/server";

type ErrorCode = 
  | "400 Bad Request"
  | "401 Unauthorized"
  | "403 Forbidden"
  | "404 Not Found"
  | "409 Conflict"
  | "500 Internal Server Error";

export function apiError(error: ErrorCode, message: string, status?: number) {
  const defaultStatusMap: Record<ErrorCode, number> = {
    "400 Bad Request": 400,
    "401 Unauthorized": 401,
    "403 Forbidden": 403,
    "404 Not Found": 404,
    "409 Conflict": 409,
    "500 Internal Server Error": 500,
  };

  const statusCode = status ?? defaultStatusMap[error] ?? 500;

  return NextResponse.json(
    {
      error,
      message,
    },
    { status: statusCode }
  );
}
