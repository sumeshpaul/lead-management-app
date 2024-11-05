export function logError(error: Error, context?: Record<string, any>) {
    console.error('Error occurred:', error.message, 'Context:', context);
    // In a production environment, you would send this to a logging service
    // For example, if using Sentry:
    // Sentry.captureException(error, { extra: context });
  }