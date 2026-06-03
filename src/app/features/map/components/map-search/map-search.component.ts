import { Component, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-map-search',
  standalone: true,
  imports: [FormsModule],
  template: `
    <form class="d-flex gap-2" (ngSubmit)="onSubmit()" [attr.aria-busy]="disabled() || null">
      <div class="input-group">
        <input
          type="search"
          class="form-control"
          [(ngModel)]="query"
          name="query"
          [placeholder]="placeholder()"
          [disabled]="disabled()"
          aria-label="Search for a location"
        />
        @if (query) {
          <button
            type="button"
            class="btn btn-outline-secondary"
            aria-label="Clear search"
            (click)="onClear()"
          >×</button>
        }
      </div>
      <button
        type="submit"
        class="btn btn-primary"
        [disabled]="disabled() || !query.trim()"
        aria-label="Search"
      >Search</button>
    </form>
  `,
})
export class MapSearchComponent {
  readonly disabled = input<boolean>(false);
  readonly placeholder = input<string>('Search for a place...');
  readonly searchSubmitted = output<string>();
  readonly searchCleared = output<void>();

  protected query = '';

  protected onSubmit(): void {
    const trimmed = this.query.trim();
    if (trimmed) this.searchSubmitted.emit(trimmed);
  }

  protected onClear(): void {
    this.query = '';
    this.searchCleared.emit();
  }
}
