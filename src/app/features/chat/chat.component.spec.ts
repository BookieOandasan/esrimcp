import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ChatComponent } from './chat.component';
import { ChatService } from '../../core/services/chat.service';
import { NgbActiveOffcanvas } from '@ng-bootstrap/ng-bootstrap';
import { signal } from '@angular/core';
import { ChatMessage } from '../../core/models/app.types';

function msg(overrides: Partial<ChatMessage> = {}): ChatMessage {
  return { id: '1', sender: 'bot', text: 'Hi!', timestamp: new Date(), status: 'success', ...overrides };
}

describe('ChatComponent', () => {
  let fixture: ComponentFixture<ChatComponent>;
  let chatService: {
    messages: ReturnType<typeof signal<ChatMessage[]>>;
    isProcessing: ReturnType<typeof signal<boolean>>;
    processMessage: ReturnType<typeof vi.fn>;
    clearChat: ReturnType<typeof vi.fn>;
  };
  let activeOffcanvas: { dismiss: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    const msgs = signal<ChatMessage[]>([msg()]);
    const processing = signal(false);
    chatService = {
      messages: msgs,
      isProcessing: processing,
      processMessage: vi.fn(),
      clearChat: vi.fn(),
    };
    activeOffcanvas = { dismiss: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [ChatComponent],
      providers: [
        { provide: ChatService, useValue: chatService },
        { provide: NgbActiveOffcanvas, useValue: activeOffcanvas },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(ChatComponent);
    fixture.detectChanges();
  });

  it('renders messages from chatService.messages()', () => {
    chatService.messages.set([
      msg({ id: '1', sender: 'user', text: 'Hello' }),
      msg({ id: '2', sender: 'bot', text: 'Found: Tokyo' }),
    ]);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Hello');
    expect(el.textContent).toContain('Found: Tokyo');
  });

  it('calls chatService.processMessage when onMessageSent is called', () => {
    fixture.componentInstance.onMessageSent('Seattle, WA');
    expect(chatService.processMessage).toHaveBeenCalledWith('Seattle, WA');
  });

  it('passes isProcessing() as disabled to ChatInputComponent', () => {
    chatService.isProcessing.set(true);
    fixture.detectChanges();
    const form = fixture.nativeElement.querySelector('form');
    expect(form?.getAttribute('aria-busy')).toBe('true');
  });

  it('shows loading spinner when isProcessing is true', () => {
    chatService.isProcessing.set(true);
    fixture.detectChanges();
    const spinner = fixture.nativeElement.querySelector('[role="status"]');
    expect(spinner).toBeTruthy();
  });

  it('calls activeOffcanvas.dismiss when close button clicked', () => {
    const closeBtn: HTMLButtonElement = fixture.nativeElement.querySelector('[aria-label="Close chat"]');
    closeBtn?.click();
    expect(activeOffcanvas.dismiss).toHaveBeenCalled();
  });

  it('history persists when component is recreated (singleton service)', () => {
    chatService.messages.set([msg({ id: '1', text: 'msg 1' }), msg({ id: '2', text: 'msg 2' })]);
    fixture.destroy();

    const fixture2 = TestBed.createComponent(ChatComponent);
    fixture2.detectChanges();
    expect(fixture2.componentInstance.chatService.messages().length).toBe(2);
    fixture2.destroy();
  });
});
