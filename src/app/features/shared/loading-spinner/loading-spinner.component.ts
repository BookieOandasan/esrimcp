import { Component, input } from '@angular/core';

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  template: `
    @if (visible()) {
      <div
        role="status"
        [attr.aria-label]="label()"
        class="d-flex align-items-center gap-2"
      >
        <div class="spinner-border spinner-border-sm text-primary" aria-hidden="true"></div>
        <span class="visually-hidden">{{ label() }}</span>
      </div>
    }
  `,
})
export class LoadingSpinnerComponent {
  readonly visible = input<boolean>(false);
  readonly label = input<string>('Loading...');
}
