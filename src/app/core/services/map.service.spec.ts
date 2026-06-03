import { TestBed } from '@angular/core/testing';
import { MapService } from './map.service';
import { ConfigService } from './config.service';
import { signal } from '@angular/core';

describe('MapService', () => {
  let service: MapService;

  beforeEach(() => {
    const configStub = {
      config: signal({ esriApiKey: 'test-key', mcpServerUrl: 'http://mcp.test' }),
      configError: signal(null),
    };

    TestBed.configureTestingModule({
      providers: [
        MapService,
        { provide: ConfigService, useValue: configStub },
      ],
    });
    service = TestBed.inject(MapService);
  });

  it('should start with uninitialized status', () => {
    expect(service.mapStatus()).toBe('uninitialized');
  });

  it('should set status to error or loading/ready after initializeMap', async () => {
    const container = document.createElement('div');
    await service.initializeMap(container);
    expect(['error', 'loading', 'ready']).toContain(service.mapStatus());
  });

  it('destroyMap should reset status to uninitialized', () => {
    service.destroyMap();
    expect(service.mapStatus()).toBe('uninitialized');
  });

  it('centerOn should not throw when map is not ready', () => {
    expect(() =>
      service.centerOn({ displayName: 'Seattle', longitude: -122.33, latitude: 47.6, score: 100 })
    ).not.toThrow();
  });
});
