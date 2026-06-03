import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ChatMessageComponent } from './chat-message.component';
import { ChatMessage } from '../../../../core/models/app.types';

function makeMessage(overrides: Partial<ChatMessage> = {}): ChatMessage {
  return {
    id: '1',
    sender: 'user',
    text: 'Hello',
    timestamp: new Date(),
    status: 'success',
    ...overrides,
  };
}

describe('ChatMessageComponent', () => {
  let fixture: ComponentFixture<ChatMessageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChatMessageComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(ChatMessageComponent);
  });

  it('renders user message right-aligned with correct aria-label', () => {
    fixture.componentRef.setInput('message', makeMessage({ sender: 'user', text: 'Where is Tokyo?' }));
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const bubble = el.querySelector('[aria-label]') as HTMLElement;
    expect(el.querySelector('.justify-content-end')).toBeTruthy();
    expect(bubble.getAttribute('aria-label')).toContain('You:');
    expect(bubble.getAttribute('aria-label')).toContain('Where is Tokyo?');
  });

  it('renders successful bot message left-aligned with correct aria-label', () => {
    fixture.componentRef.setInput('message', makeMessage({ sender: 'bot', text: 'Found: Tokyo', status: 'success' }));
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.justify-content-start')).toBeTruthy();
    const bubble = el.querySelector('[aria-label]') as HTMLElement;
    expect(bubble.getAttribute('aria-label')).toContain('Assistant:');
    expect(bubble.getAttribute('aria-label')).toContain('Found: Tokyo');
  });

  it('error bot message has role="alert"', () => {
    fixture.componentRef.setInput('message', makeMessage({ sender: 'bot', status: 'error', text: 'Service unavailable' }));
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('[role="alert"]')).toBeTruthy();
  });

  it('pending bot message shows spinner with role="status"', () => {
    fixture.componentRef.setInput('message', makeMessage({ sender: 'bot', status: 'pending', text: '' }));
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('[role="status"]')).toBeTruthy();
  });
});
