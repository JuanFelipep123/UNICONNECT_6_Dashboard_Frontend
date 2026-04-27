export const ErrorType = {
  NETWORK: 'NETWORK',
  VALIDATION: 'VALIDATION',
  AUTHENTICATION: 'AUTHENTICATION',
  SERVER: 'SERVER',
  UNKNOWN: 'UNKNOWN',
} as const;

export type ErrorType = (typeof ErrorType)[keyof typeof ErrorType];

export interface AppError {
  type: ErrorType;
  message: string;
  originalError?: Error;
}

export const parseError = (error: unknown): AppError => {
  if (error instanceof Error) {
    return {
      type: classifyError(error.message),
      message: error.message,
      originalError: error,
    };
  }

  if (typeof error === 'string') {
    return { type: ErrorType.UNKNOWN, message: error };
  }

  return { type: ErrorType.UNKNOWN, message: 'Ocurrio un error inesperado' };
};

const classifyError = (message: string): ErrorType => {
  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes('network') || lowerMessage.includes('fetch') || lowerMessage.includes('connection')) {
    return ErrorType.NETWORK;
  }

  if (lowerMessage.includes('token') || lowerMessage.includes('401')) {
    return ErrorType.AUTHENTICATION;
  }

  if (lowerMessage.includes('validation')) {
    return ErrorType.VALIDATION;
  }

  if (lowerMessage.includes('500') || lowerMessage.includes('server')) {
    return ErrorType.SERVER;
  }

  return ErrorType.UNKNOWN;
};
