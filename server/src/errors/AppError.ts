export class AppError extends Error {
  readonly statusCode: number;
  readonly code: string;
  readonly details: { field?: string; message: string }[];
  readonly isOperational = true;

  constructor(
    statusCode: number,
    code: string,
    message: string,
    details: { field?: string; message: string }[] = [],
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}
