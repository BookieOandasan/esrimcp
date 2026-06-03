import { Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-chat-input',
  standalone: true,
  imports: [FormsModule],
  template: `
    <form (ngSubmit)="onSubmit()" [attr.aria-busy]="disabled() ? 'true' : null" class="mt-2">
      <div class="input-group">
        <input
          type="text"
          class="form-control"
          [(ngModel)]="text"
          name="chatInput"
          aria-label="Type a location to find on the map"
          placeholder="Ask me to show you a place..."
          [disabled]="disabled()"
          autocomplete="off"
        />
        <button
          type="submit"
          class="btn btn-primary"
          aria-label="Send message"
          [disabled]="disabled()"
        >Send</button>
      </div>
    </form>
  `,
})
export class ChatInputComponent {
  readonly disabled = input<boolean>(false);
  readonly messageSent = output<string>();

  protected text = '';

  onSubmit(): void {
    const trimmed = this.text.trim().slice(0, 500);
    if (!trimmed) return;
    this.messageSent.emit(trimmed);
    this.text = '';
  }
}
