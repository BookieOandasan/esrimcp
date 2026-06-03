import { Component, input } from '@angular/core';
import { ChatMessage } from '../../../../core/models/app.types';

@Component({
  selector: 'app-chat-message',
  standalone: true,
  template: `
    <div class="d-flex mb-2"
         [class.justify-content-end]="message().sender === 'user'"
         [class.justify-content-start]="message().sender === 'bot'">
      @if (message().status === 'pending') {
        <div class="chat-bubble p-2 px-3 rounded bg-light border"
             role="status" aria-label="Assistant is thinking">
          <div class="d-flex align-items-center gap-2">
            <div class="spinner-border spinner-border-sm text-secondary" aria-hidden="true"></div>
            <span class="text-muted small">Thinking...</span>
          </div>
        </div>
      } @else {
        <div class="chat-bubble p-2 px-3 rounded shadow-sm"
             [class.bg-primary]="message().sender === 'user'"
             [class.text-white]="message().sender === 'user'"
             [class.bg-light]="message().sender === 'bot'"
             [class.border]="message().sender === 'bot'"
             [class.border-danger]="message().status === 'error'"
             [attr.role]="message().status === 'error' ? 'alert' : null"
             [attr.aria-label]="message().sender === 'user' ? 'You: ' + message().text : 'Assistant: ' + message().text">
          {{ message().text }}
        </div>
      }
    </div>
  `,
  styles: [`
    .chat-bubble { max-width: 80%; word-wrap: break-word; }
  `],
})
export class ChatMessageComponent {
  readonly message = input.required<ChatMessage>();
}
