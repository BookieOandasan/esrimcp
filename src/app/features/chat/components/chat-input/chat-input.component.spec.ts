import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ChatInputComponent } from './chat-input.component';
import { By } from '@angular/platform-browser';

describe('ChatInputComponent', () => {
  let fixture: ComponentFixture<ChatInputComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChatInputComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(ChatInputComponent);
    fixture.detectChanges();
  });

  it('emits messageSent with trimmed text on form submit', () => {
    const sent = vi.fn();
    fixture.componentInstance.messageSent.subscribe(sent);

    const input: HTMLInputElement = fixture.debugElement.query(By.css('input')).nativeElement;
    input.value = '  Seattle, WA  ';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    fixture.debugElement.query(By.css('form')).nativeElement.dispatchEvent(new Event('submit'));
    expect(sent).toHaveBeenCalledWith('Seattle, WA');
  });

  it('does not emit for empty input', () => {
    const sent = vi.fn();
    fixture.componentInstance.messageSent.subscribe(sent);
    fixture.debugElement.query(By.css('form')).nativeElement.dispatchEvent(new Event('submit'));
    expect(sent).not.toHaveBeenCalled();
  });

  it('clears the model after successful emit', () => {
    const input: HTMLInputElement = fixture.debugElement.query(By.css('input')).nativeElement;
    input.value = 'Tokyo';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    fixture.debugElement.query(By.css('form')).nativeElement.dispatchEvent(new Event('submit'));
    fixture.detectChanges();
    // ngModel clears the component text property; jsdom may not reflect DOM immediately
    expect((fixture.componentInstance as unknown as { text: string }).text).toBe('');
  });

  it('sets aria-busy on form when disabled is true', () => {
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();
    const form = fixture.debugElement.query(By.css('form'));
    expect(form.nativeElement.getAttribute('aria-busy')).toBe('true');
  });

  it('input has correct aria-label', () => {
    const input = fixture.debugElement.query(By.css('input'));
    expect(input.nativeElement.getAttribute('aria-label')).toBe('Type a location to find on the map');
  });
});
