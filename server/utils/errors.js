export class AppError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
  }
}

export const ensure = (condition, statusCode, message) => {
  if (!condition) {
    throw new AppError(statusCode, message);
  }
};
