import { ErrorHandler, Injectable } from '@angular/core';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  handleError(error: unknown): void {
    const message = error instanceof Error ? error.message : String(error);
    // ArcGIS tile rendering race conditions are transient and self-recovering — skip logging
    if (message.includes('VectorTileLayerView') || message.includes("Cannot destructure property 'spans'")) {
      return;
    }
    console.error(JSON.stringify({
      timestamp: new Date().toISOString(),
      type: 'UnhandledError',
      message,
      stack: error instanceof Error ? error.stack : undefined,
    }));
  }
}
