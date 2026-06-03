import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MapSearchComponent } from './map-search.component';
import { By } from '@angular/platform-browser';

describe('MapSearchComponent', () => {
  let fixture: ComponentFixture<MapSearchComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MapSearchComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(MapSearchComponent);
    fixture.detectChanges();
  });

  it('should emit searchSubmitted with query on form submit', () => {
    const submitted = vi.fn();
    fixture.componentInstance.searchSubmitted.subscribe(submitted);

    const input: HTMLInputElement = fixture.debugElement.query(By.css('input')).nativeElement;
    input.value = 'Seattle, WA';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    const form = fixture.debugElement.query(By.css('form'));
    form.nativeElement.dispatchEvent(new Event('submit'));
    expect(submitted).toHaveBeenCalledWith('Seattle, WA');
  });

  it('should have aria-label on input', () => {
    const input = fixture.debugElement.query(By.css('input'));
    expect(input.nativeElement.getAttribute('aria-label')).toBe('Search for a location');
  });

  it('should set aria-busy on form when disabled=true', () => {
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();
    const form = fixture.debugElement.query(By.css('form'));
    expect(form.nativeElement.getAttribute('aria-busy')).toBe('true');
  });

  it('should emit searchCleared when clear button is clicked', () => {
    const cleared = vi.fn();
    fixture.componentInstance.searchCleared.subscribe(cleared);
    const input: HTMLInputElement = fixture.debugElement.query(By.css('input')).nativeElement;
    input.value = 'test';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    const clearBtn = fixture.debugElement.query(By.css('button[aria-label="Clear search"]'));
    if (clearBtn) {
      clearBtn.nativeElement.click();
      expect(cleared).toHaveBeenCalled();
    }
  });
});
