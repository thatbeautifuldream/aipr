export class AppError extends Error {
  readonly stdout?: string;
  readonly stderr?: string;
  readonly exitCode?: number;

  constructor(
    message: string,
    options?: { stdout?: string; stderr?: string; exitCode?: number }
  ) {
    super(message);
    this.name = "AppError";
    this.stdout = options?.stdout;
    this.stderr = options?.stderr;
    this.exitCode = options?.exitCode;
  }
}
