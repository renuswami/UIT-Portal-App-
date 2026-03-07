export class AppError extends Error {
    readonly code: string;
    readonly cause?: unknown;

    constructor(message: string, code = 'APP_ERROR', cause?: unknown) {
        super(message);
        this.name = 'AppError';
        this.code = code;
        this.cause = cause;
    }
}

export const getErrorMessage = (error: unknown, fallback = 'Unexpected error'): string => {
    if (error instanceof Error && error.message) {
        return error.message;
    }

    if (typeof error === 'string' && error) {
        return error;
    }

    return fallback;
};
