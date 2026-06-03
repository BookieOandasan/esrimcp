import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { MapCanvasComponent } from './components/map-canvas/map-canvas.component';
import { MapSearchComponent } from './components/map-search/map-search.component';
import { ErrorBannerComponent } from '../shared/error-banner/error-banner.component';
import { LoadingSpinnerComponent } from '../shared/loading-spinner/loading-spinner.component';
import { EsriMcpService } from '../../core/services/esri-mcp.service';
import { MapService } from '../../core/services/map.service';
import { GeocodingService } from '../../core/services/geocoding.service';
import { NgbOffcanvas } from '@ng-bootstrap/ng-bootstrap';
import { ChatComponent } from '../chat/chat.component';

@Component({
  selector: 'app-map',
  standalone: true,
  imports: [
    MapCanvasComponent,
    MapSearchComponent,
    ErrorBannerComponent,
    LoadingSpinnerComponent,
  ],
  template: `
    <div class="d-flex flex-column h-100">
      <!-- Search bar -->
      <div class="p-2 bg-white border-bottom shadow-sm">
        <app-map-search
          [disabled]="searching()"
          (searchSubmitted)="onSearch($event)"
          (searchCleared)="searchError.set(null)"
        />
        <button
          type="button"
          class="btn btn-outline-secondary ms-2 flex-shrink-0"
          aria-label="Open AI chat"
          (click)="openChat()">💬</button>
        <div class="mt-1 d-flex align-items-center gap-2">
          <app-loading-spinner [visible]="searching()" label="Searching..." />
          @if (searchError()) {
            <span class="text-danger small">{{ searchError() }}</span>
          }
        </div>
      </div>

      <!-- Map error banner -->
      @if (mapError()) {
        <app-error-banner [message]="mapError()" (dismissed)="mapError.set(null)" />
      }

      <!-- Map canvas — fills remaining height -->
      <div class="flex-grow-1 position-relative">
        <app-map-canvas
          (mapError)="mapError.set($event)"
        />
      </div>
    </div>
  `,
})
export class MapComponent implements OnInit, OnDestroy {
  private mcpService = inject(EsriMcpService);
  private mapService = inject(MapService);
  private geocodingService = inject(GeocodingService);
  private offcanvasService = inject(NgbOffcanvas);

  protected searching = signal(false);
  protected mapError = signal<string | null>(null);
  protected searchError = signal<string | null>(null);

  async ngOnInit(): Promise<void> {
    // Attempt MCP connection — non-fatal if server isn't running
    try {
      await this.mcpService.connect();
    } catch {
      // Falls back to ArcGIS locator for geocoding
    }
  }

  openChat(): void {
    this.offcanvasService.open(ChatComponent, { position: 'end', ariaLabelledBy: 'chat-panel-title' });
  }

  ngOnDestroy(): void {
    this.mcpService.disconnect();
  }

  async onSearch(query: string): Promise<void> {
    this.searching.set(true);
    this.searchError.set(null);
    try {
      // Use MCP if session is active, otherwise fall back to ArcGIS locator
      const result = this.mcpService.sessionStatus() === 'active'
        ? await this.mcpService.callTool('geocode_location', { query })
        : await this.geocodingService.geocode(query);

      this.mapService.centerOn(result);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Search failed. Please try again.';
      this.searchError.set(msg);
    } finally {
      this.searching.set(false);
    }
  }
}
