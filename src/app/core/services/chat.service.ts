import { Injectable, signal } from '@angular/core';
import { ChatMessage } from '../models/app.types';
import { EsriMcpService } from './esri-mcp.service';
import { GeocodingService } from './geocoding.service';
import { MapService } from './map.service';

const WELCOME_TEXT = "Hi! I can help you find locations on the map. Try asking me to show you a place!";

function makeWelcome(): ChatMessage {
  return { id: 'welcome', sender: 'bot', text: WELCOME_TEXT, timestamp: new Date(), status: 'success' };
}

@Injectable({ providedIn: 'root' })
export class ChatService {
  private readonly _messages = signal<ChatMessage[]>([makeWelcome()]);
  private readonly _isProcessing = signal(false);

  readonly messages = this._messages.asReadonly();
  readonly isProcessing = this._isProcessing.asReadonly();

  constructor(
    private mcpService: EsriMcpService,
    private geocodingService: GeocodingService,
    private mapService: MapService,
  ) {}

  async processMessage(text: string): Promise<void> {
    const trimmed = text.trim();
    if (!trimmed) return;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      sender: 'user',
      text: trimmed,
      timestamp: new Date(),
      status: 'success',
    };
    const pendingId = crypto.randomUUID();
    const pendingMsg: ChatMessage = {
      id: pendingId,
      sender: 'bot',
      text: '',
      timestamp: new Date(),
      status: 'pending',
    };

    this._messages.update(msgs => [...msgs, userMsg, pendingMsg]);
    this._isProcessing.set(true);

    const start = Date.now();
    let responseStatus: 'success' | 'error' | 'no_results' = 'success';

    try {
      const result = this.mcpService.sessionStatus() === 'active'
        ? await this.mcpService.callTool('geocode_location', { query: trimmed })
        : await this.geocodingService.geocode(trimmed);

      this.mapService.centerOn(result);
      this._messages.update(msgs => msgs.map(m =>
        m.id === pendingId ? { ...m, status: 'success' as const, text: `Found: ${result.displayName}` } : m
      ));
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      const isNoResults = msg.includes('No results found') || msg.includes('No result');

      if (isNoResults) {
        responseStatus = 'no_results';
        this._messages.update(msgs => msgs.map(m =>
          m.id === pendingId
            ? { ...m, status: 'success' as const, text: "I couldn't find that location. Try a different place name or be more specific." }
            : m
        ));
      } else {
        responseStatus = 'error';
        this._messages.update(msgs => msgs.map(m =>
          m.id === pendingId
            ? { ...m, status: 'error' as const, text: 'The map service is temporarily unavailable. Please try again shortly.' }
            : m
        ));
      }
    } finally {
      this._isProcessing.set(false);
      console.log(JSON.stringify({
        timestamp: new Date().toISOString(),
        feature: 'chat',
        query: trimmed,
        responseStatus,
        durationMs: Date.now() - start,
      }));
    }
  }

  clearChat(): void {
    this._messages.set([makeWelcome()]);
  }
}
