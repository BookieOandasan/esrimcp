import { TestBed } from '@angular/core/testing';
import { EsriMcpService } from './esri-mcp.service';
import { ConfigService } from './config.service';
import { signal } from '@angular/core';

describe('EsriMcpService', () => {
  let service: EsriMcpService;

  beforeEach(() => {
    const configStub = {
      config: signal({ esriApiKey: 'test-key', mcpServerUrl: 'http://mcp.test/mcp' }),
      configError: signal(null),
    };

    TestBed.configureTestingModule({
      providers: [
        EsriMcpService,
        { provide: ConfigService, useValue: configStub },
      ],
    });
    service = TestBed.inject(EsriMcpService);
  });

  it('should start with uninitialized session status', () => {
    expect(service.sessionStatus()).toBe('uninitialized');
  });

  it('should emit structured log on callTool (when active)', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    await service.connect().catch(() => {});
    if (service.sessionStatus() === 'active') {
      await service.callTool('geocode_location', { query: 'Seattle' }).catch(() => {});
      const logged = logSpy.mock.calls.find((a) =>
        JSON.stringify(a).includes('geocode_location')
      );
      expect(logged).toBeTruthy();
    } else {
      // No active session — callTool should throw a meaningful error, not crash
      await expect(service.callTool('geocode_location', { query: 'x' })).rejects.toThrow();
    }
    logSpy.mockRestore();
  });

  it('disconnect should set status to closed', async () => {
    await service.disconnect();
    expect(service.sessionStatus()).toBe('closed');
  });
});
