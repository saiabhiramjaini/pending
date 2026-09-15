export class ApiError extends Error {
  readonly code: string;
  readonly status: number;
  readonly details: { field?: string; message: string }[];

  constructor(code: string, message: string, status: number, details: { field?: string; message: string }[] = []) {
    super(message);
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export const ERROR_MESSAGES: Record<number, string> = {
  401: "Unauthorized",
  403: "You can't do that",
  404: "Not found",
  409: "Already updated",
};

export function messageForStatus(status: number): string {
  if (status >= 500) return "Something went wrong. Try again.";
  return ERROR_MESSAGES[status] ?? "Something went wrong. Try again.";
}
