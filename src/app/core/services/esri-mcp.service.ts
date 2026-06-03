import { Injectable, signal, OnDestroy } from '@angular/core';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import {
  GeocodeLocationInput,
  GeocodeResult,
  McpToolLog,
  McpToolName,
  SessionStatus,
} from '../models/app.types';
import { ConfigService } from './config.service';

@Injectable({ providedIn: 'root' })
export class EsriMcpService implements OnDestroy {
  private readonly _sessionStatus = signal<SessionStatus>('uninitialized');
  readonly sessionStatus = this._sessionStatus.asReadonly();

  private client: Client | null = null;

  constructor(private config: ConfigService) {}

  async connect(): Promise<void> {
    const cfg = this.config.config();
    if (!cfg) throw new Error('Config not loaded.');
    this._sessionStatus.set('connecting');
    try {
      const transport = new StreamableHTTPClientTransport(new URL(cfg.mcpServerUrl));
      this.client = new Client({ name: 'esrimcp-angular', version: '1.0.0' });
      await this.client.connect(transport);
      this._sessionStatus.set('active');
    } catch (err) {
      this._sessionStatus.set('error');
      throw err;
    }
  }

  async callTool(
    tool: 'geocode_location',
    params: GeocodeLocationInput
  ): Promise<GeocodeResult> {
    if (this._sessionStatus() !== 'active' || !this.client) {
      throw new Error('MCP session is not active.');
    }
    const start = Date.now();
    const log: Partial<McpToolLog> = {
      timestamp: new Date().toISOString(),
      tool,
      params: params as unknown as Record<string, unknown>,
    };
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await this.client.callTool({ name: tool, arguments: params as any });
      log.responseStatus = 'success';
      log.durationMs = Date.now() - start;
      console.log('[EsriMcpService]', JSON.stringify(log));
      return response.content as unknown as GeocodeResult;
    } catch (err) {
      log.responseStatus = 'error';
      log.durationMs = Date.now() - start;
      log.error = err instanceof Error ? err.message : String(err);
      console.log('[EsriMcpService]', JSON.stringify(log));
      throw err;
    }
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.close().catch(() => {});
      this.client = null;
    }
    this._sessionStatus.set('closed');
  }

  ngOnDestroy(): void {
    this.disconnect();
  }
}
