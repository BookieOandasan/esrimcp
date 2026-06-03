import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MapCanvasComponent } from './map-canvas.component';
import { MapService } from '../../../../core/services/map.service';
import { ConfigService } from '../../../../core/services/config.service';
import { signal } from '@angular/core';

describe('MapCanvasComponent', () => {
  let fixture: ComponentFixture<MapCanvasComponent>;
  let initializeMapSpy: ReturnType<typeof vi.fn>;
  let destroyMapSpy: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    initializeMapSpy = vi.fn().mockResolvedValue(undefined);
    destroyMapSpy = vi.fn();

    const mapServiceStub = {
      initializeMap: initializeMapSpy,
      destroyMap: destroyMapSpy,
      centerOn: vi.fn(),
      mapStatus: signal<'uninitialized' | 'loading' | 'ready' | 'error'>('ready'),
      mapError: signal<string | null>(null),
    };

    const configStub = {
      config: signal({ esriApiKey: 'test-key', mcpServerUrl: 'http://mcp.test' }),
      configError: signal(null),
    };

    await TestBed.configureTestingModule({
      imports: [MapCanvasComponent],
      providers: [
        { provide: MapService, useValue: mapServiceStub },
        { provide: ConfigService, useValue: configStub },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MapCanvasComponent);
  });

  it('should have role=application with aria-label on the map host', () => {
    fixture.detectChanges();
    const mapEl = fixture.nativeElement.querySelector('[role="application"]');
    expect(mapEl).toBeTruthy();
    expect(mapEl.getAttribute('aria-label')).toBe('Interactive map');
  });

  it('should call MapService.initializeMap after view init', async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    expect(initializeMapSpy).toHaveBeenCalled();
  });

  it('should call MapService.destroyMap on destroy', () => {
    fixture.detectChanges();
    fixture.destroy();
    expect(destroyMapSpy).toHaveBeenCalled();
  });
});
