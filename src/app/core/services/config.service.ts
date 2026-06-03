import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { AppConfig } from '../models/config.model';

@Injectable({ providedIn: 'root' })
export class ConfigService {
  private readonly _config = signal<AppConfig | null>(null);
  private readonly _configError = signal<string | null>(null);

  readonly config = this._config.asReadonly();
  readonly configError = this._configError.asReadonly();

  constructor(private http: HttpClient) {}

  async load(): Promise<void> {
    try {
      const raw = await firstValueFrom(this.http.get<Partial<AppConfig>>('/config.json'));
      if (!raw['esriApiKey']) {
        this._configError.set('Missing required config field: esriApiKey');
        return;
      }
      if (!raw['mcpServerUrl']) {
        this._configError.set('Missing required config field: mcpServerUrl');
        return;
      }
      this._config.set(raw as AppConfig);
    } catch {
      this._configError.set('Failed to load /config.json. Ensure it exists with esriApiKey and mcpServerUrl.');
    }
  }
}
