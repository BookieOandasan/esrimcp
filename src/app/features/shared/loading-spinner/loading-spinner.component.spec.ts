import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LoadingSpinnerComponent } from './loading-spinner.component';
import { By } from '@angular/platform-browser';

describe('LoadingSpinnerComponent', () => {
  let fixture: ComponentFixture<LoadingSpinnerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoadingSpinnerComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(LoadingSpinnerComponent);
  });

  it('should be visible when visible=true', () => {
    fixture.componentRef.setInput('visible', true);
    fixture.detectChanges();
    const el = fixture.debugElement.query(By.css('[role="status"]'));
    expect(el).toBeTruthy();
    expect(el.nativeElement.getAttribute('aria-hidden')).not.toBe('true');
  });

  it('should be hidden from accessibility tree when visible=false', () => {
    fixture.componentRef.setInput('visible', false);
    fixture.detectChanges();
    const el = fixture.debugElement.query(By.css('[role="status"]'));
    expect(el).toBeNull();
  });

  it('should bind aria-label to label input', () => {
    fixture.componentRef.setInput('visible', true);
    fixture.componentRef.setInput('label', 'Searching...');
    fixture.detectChanges();
    const el = fixture.debugElement.query(By.css('[role="status"]'));
    expect(el.nativeElement.getAttribute('aria-label')).toBe('Searching...');
  });
});
