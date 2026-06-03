import { ErrorHandler, Injectable } from '@angular/core';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  handleError(error: unknown): void {
    const message = error instanceof Error ? error.message : String(error);
    console.error(JSON.stringify({
      timestamp: new Date().toISOString(),
      type: 'UnhandledError',
      message,
      stack: error instanceof Error ? error.stack : undefined,
    }));
  }
}
