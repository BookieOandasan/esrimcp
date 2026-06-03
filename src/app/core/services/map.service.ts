import { Injectable, signal } from '@angular/core';
import { GeocodeResult, MapStatus } from '../models/app.types';
import { ConfigService } from './config.service';

@Injectable({ providedIn: 'root' })
export class MapService {
  private readonly _mapStatus = signal<MapStatus>('uninitialized');
  private readonly _mapError = signal<string | null>(null);
  // Dynamically imported ArcGIS MapView instance
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private mapView: any = null;

  readonly mapStatus = this._mapStatus.asReadonly();
  readonly mapError = this._mapError.asReadonly();

  constructor(private config: ConfigService) {}

  async initializeMap(container: HTMLElement): Promise<void> {
    this._mapStatus.set('loading');
    this._mapError.set(null);

    const cfg = this.config.config();
    if (!cfg) {
      this._mapStatus.set('error');
      this._mapError.set('App configuration not loaded.');
      return;
    }

    try {
      const [{ default: esriConfig }, { default: ArcGISMap }, { default: MapView }] = await Promise.all([
        import('@arcgis/core/config.js'),
        import('@arcgis/core/Map.js'),
        import('@arcgis/core/views/MapView.js'),
      ]);

      esriConfig.apiKey = cfg.esriApiKey;
      esriConfig.log.level = 'error'; // suppress FBO resize + tile rendering noise

      const map = new ArcGISMap({ basemap: 'arcgis/navigation' });
      const center = cfg.mapDefaultCenter ?? [-98.5795, 39.8283];
      const zoom = cfg.mapDefaultZoom ?? 4;

      this.mapView = new MapView({ container: container as HTMLDivElement, map, center, zoom });
      await this.mapView.when();
      this._mapStatus.set('ready');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Map failed to load.';
      this._mapStatus.set('error');
      this._mapError.set(message);
    }
  }

  centerOn(result: GeocodeResult): void {
    if (!this.mapView || this._mapStatus() !== 'ready') return;
    this.mapView.goTo({ center: [result.longitude, result.latitude], zoom: 12 });
  }

  destroyMap(): void {
    if (this.mapView) {
      this.mapView.destroy();
      this.mapView = null;
    }
    this._mapStatus.set('uninitialized');
    this._mapError.set(null);
  }
}
