import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ConfigService } from './config.service';

describe('ConfigService', () => {
  let service: ConfigService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ConfigService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(ConfigService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should load config and expose esriApiKey', async () => {
    const loadPromise = service.load();
    const req = httpMock.expectOne('/config.json');
    req.flush({ esriApiKey: 'test-key', mcpServerUrl: 'http://mcp.example.com' });
    await loadPromise;
    expect(service.config()?.esriApiKey).toBe('test-key');
    expect(service.configError()).toBeNull();
  });

  it('should set configError when esriApiKey is missing', async () => {
    const loadPromise = service.load();
    const req = httpMock.expectOne('/config.json');
    req.flush({ mcpServerUrl: 'http://mcp.example.com' });
    await loadPromise;
    expect(service.configError()).toContain('esriApiKey');
    expect(service.config()).toBeNull();
  });

  it('should set configError when mcpServerUrl is missing', async () => {
    const loadPromise = service.load();
    const req = httpMock.expectOne('/config.json');
    req.flush({ esriApiKey: 'test-key' });
    await loadPromise;
    expect(service.configError()).toContain('mcpServerUrl');
    expect(service.config()).toBeNull();
  });

  it('should set configError when config.json request fails', async () => {
    const loadPromise = service.load();
    const req = httpMock.expectOne('/config.json');
    req.error(new ProgressEvent('error'));
    await loadPromise;
    expect(service.configError()).toBeTruthy();
    expect(service.config()).toBeNull();
  });
});
