import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ErrorBannerComponent } from './error-banner.component';
import { By } from '@angular/platform-browser';

describe('ErrorBannerComponent', () => {
  let fixture: ComponentFixture<ErrorBannerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ErrorBannerComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(ErrorBannerComponent);
  });

  it('should render message when provided', () => {
    fixture.componentRef.setInput('message', 'Something went wrong');
    fixture.detectChanges();
    const banner = fixture.debugElement.query(By.css('[role="alert"]'));
    expect(banner).toBeTruthy();
    expect(banner.nativeElement.textContent).toContain('Something went wrong');
  });

  it('should not render banner when message is null', () => {
    fixture.componentRef.setInput('message', null);
    fixture.detectChanges();
    const banner = fixture.debugElement.query(By.css('[role="alert"]'));
    expect(banner).toBeNull();
  });

  it('should emit dismissed when dismiss button is clicked', () => {
    fixture.componentRef.setInput('message', 'Error!');
    fixture.componentRef.setInput('dismissable', true);
    fixture.detectChanges();
    const dismissed = vi.fn();
    fixture.componentInstance.dismissed.subscribe(dismissed);
    const btn = fixture.debugElement.query(By.css('button[aria-label="Dismiss error"]'));
    btn.nativeElement.click();
    expect(dismissed).toHaveBeenCalled();
  });
});
