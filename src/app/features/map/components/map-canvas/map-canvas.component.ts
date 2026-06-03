import {
  Component,
  ElementRef,
  OnDestroy,
  AfterViewInit,
  ViewChild,
  output,
  inject,
} from '@angular/core';
import { MapService } from '../../../../core/services/map.service';

@Component({
  selector: 'app-map-canvas',
  standalone: true,
  template: `
    <div
      #mapContainer
      role="application"
      aria-label="Interactive map"
      class="map-container w-100 h-100"
    ></div>
  `,
  styles: [`
    :host { display: block; width: 100%; height: 100%; }
    .map-container { min-height: 400px; }
  `],
})
export class MapCanvasComponent implements AfterViewInit, OnDestroy {
  @ViewChild('mapContainer') mapContainer!: ElementRef<HTMLDivElement>;

  readonly mapReady = output<void>();
  readonly mapError = output<string>();

  private mapService = inject(MapService);

  async ngAfterViewInit(): Promise<void> {
    await this.mapService.initializeMap(this.mapContainer.nativeElement);
    if (this.mapService.mapStatus() === 'ready') {
      this.mapReady.emit();
    } else {
      this.mapError.emit(this.mapService.mapError() ?? 'Map failed to initialize.');
    }
  }

  ngOnDestroy(): void {
    this.mapService.destroyMap();
  }
}
