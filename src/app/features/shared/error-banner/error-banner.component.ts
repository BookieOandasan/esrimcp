import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-error-banner',
  standalone: true,
  template: `
    @if (message()) {
      <div
        class="alert alert-danger alert-dismissible d-flex align-items-center mb-0"
        role="alert"
        aria-live="assertive"
      >
        <span class="flex-grow-1">{{ message() }}</span>
        @if (dismissable()) {
          <button
            type="button"
            class="btn-close ms-2"
            aria-label="Dismiss error"
            (click)="dismissed.emit()"
          ></button>
        }
      </div>
    }
  `,
})
export class ErrorBannerComponent {
  readonly message = input<string | null>(null);
  readonly dismissable = input<boolean>(true);
  readonly dismissed = output<void>();
}
