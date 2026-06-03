import { TestBed } from '@angular/core/testing';
import { ChatService } from './chat.service';
import { EsriMcpService } from './esri-mcp.service';
import { GeocodingService } from './geocoding.service';
import { MapService } from './map.service';
import { GeocodeResult } from '../models/app.types';

const mockResult: GeocodeResult = {
  displayName: 'Seattle, WA, USA',
  longitude: -122.33,
  latitude: 47.60,
  score: 100,
};

describe('ChatService', () => {
  let service: ChatService;
  let mcpService: { sessionStatus: ReturnType<typeof vi.fn>; callTool: ReturnType<typeof vi.fn> };
  let geocodingService: { geocode: ReturnType<typeof vi.fn> };
  let mapService: { centerOn: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    mcpService = { sessionStatus: vi.fn().mockReturnValue('error'), callTool: vi.fn() };
    geocodingService = { geocode: vi.fn().mockResolvedValue(mockResult) };
    mapService = { centerOn: vi.fn() };

    TestBed.configureTestingModule({
      providers: [
        ChatService,
        { provide: EsriMcpService, useValue: mcpService },
        { provide: GeocodingService, useValue: geocodingService },
        { provide: MapService, useValue: mapService },
      ],
    });
    service = TestBed.inject(ChatService);
  });

  it('initialises with one welcome bot message', () => {
    const msgs = service.messages();
    expect(msgs.length).toBe(1);
    expect(msgs[0].sender).toBe('bot');
    expect(msgs[0].status).toBe('success');
  });

  it('processMessage adds user message and success bot reply via GeocodingService fallback', async () => {
    mcpService.sessionStatus.mockReturnValue('error');
    geocodingService.geocode.mockResolvedValue(mockResult);

    await service.processMessage('Seattle, WA');

    const msgs = service.messages();
    expect(msgs.length).toBe(3); // welcome + user + bot
    expect(msgs[1].sender).toBe('user');
    expect(msgs[1].text).toBe('Seattle, WA');
    expect(msgs[2].sender).toBe('bot');
    expect(msgs[2].status).toBe('success');
    expect(msgs[2].text).toContain('Seattle, WA, USA');
    expect(mapService.centerOn).toHaveBeenCalledWith(mockResult);
  });

  it('processMessage uses EsriMcpService when session is active', async () => {
    mcpService.sessionStatus.mockReturnValue('active');
    mcpService.callTool.mockResolvedValue(mockResult);

    await service.processMessage('Tokyo');

    expect(mcpService.callTool).toHaveBeenCalledWith('geocode_location', { query: 'Tokyo' });
    expect(geocodingService.geocode).not.toHaveBeenCalled();
    expect(mapService.centerOn).toHaveBeenCalledWith(mockResult);
  });

  it('processMessage with no-results error adds friendly bot reply without moving map', async () => {
    geocodingService.geocode.mockRejectedValue(new Error('No results found for "xyzzy"'));

    await service.processMessage('xyzzy');

    const msgs = service.messages();
    const botReply = msgs[msgs.length - 1];
    expect(botReply.sender).toBe('bot');
    expect(botReply.text).toContain("couldn't find");
    expect(mapService.centerOn).not.toHaveBeenCalled();
  });

  it('processMessage with service error adds error bot reply', async () => {
    geocodingService.geocode.mockRejectedValue(new Error('Network failure'));

    await service.processMessage('Paris');

    const msgs = service.messages();
    const botReply = msgs[msgs.length - 1];
    expect(botReply.status).toBe('error');
    expect(botReply.text).toContain('temporarily unavailable');
    expect(mapService.centerOn).not.toHaveBeenCalled();
  });

  it('processMessage ignores empty or whitespace-only input', async () => {
    await service.processMessage('   ');
    expect(service.messages().length).toBe(1); // only welcome message
    expect(geocodingService.geocode).not.toHaveBeenCalled();
  });

  it('isProcessing is true during call and false after', async () => {
    let capturedDuring = false;
    geocodingService.geocode.mockImplementation(async () => {
      capturedDuring = service.isProcessing();
      return mockResult;
    });

    await service.processMessage('London');
    expect(capturedDuring).toBe(true);
    expect(service.isProcessing()).toBe(false);
  });

  it('clearChat resets to single welcome message', async () => {
    await service.processMessage('Seattle');
    expect(service.messages().length).toBe(3);

    service.clearChat();
    expect(service.messages().length).toBe(1);
    expect(service.messages()[0].sender).toBe('bot');
  });
});
