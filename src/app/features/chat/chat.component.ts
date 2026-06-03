import { Component, inject, AfterViewChecked, ElementRef, ViewChild } from '@angular/core';
import { NgbActiveOffcanvas } from '@ng-bootstrap/ng-bootstrap';
import { ChatService } from '../../core/services/chat.service';
import { LoadingSpinnerComponent } from '../shared/loading-spinner/loading-spinner.component';
import { ChatMessageComponent } from './components/chat-message/chat-message.component';
import { ChatInputComponent } from './components/chat-input/chat-input.component';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [ChatMessageComponent, ChatInputComponent, LoadingSpinnerComponent],
  template: `
    <div class="offcanvas-header border-bottom">
      <h5 class="offcanvas-title" id="chat-panel-title">Map Assistant</h5>
      <div class="d-flex align-items-center gap-2">
        @if (chatService.messages().length > 1) {
          <button
            type="button"
            class="btn btn-sm btn-outline-secondary"
            aria-label="Clear chat history"
            (click)="chatService.clearChat()">
            Clear
          </button>
        }
        <button
          type="button"
          class="btn-close"
          aria-label="Close chat"
          (click)="activeOffcanvas.dismiss()">
        </button>
      </div>
    </div>

    <div class="offcanvas-body d-flex flex-column p-3 gap-0">
      <div
        #messagesContainer
        class="flex-grow-1 overflow-y-auto mb-2"
        role="log"
        aria-live="polite"
        aria-label="Chat conversation"
        style="max-height: calc(100vh - 200px);">
        @for (msg of chatService.messages(); track msg.id) {
          <app-chat-message [message]="msg" />
        }
        @if (chatService.isProcessing()) {
          <app-loading-spinner [visible]="true" label="Thinking..." />
        }
      </div>

      <app-chat-input
        [disabled]="chatService.isProcessing()"
        (messageSent)="onMessageSent($event)"
      />
    </div>
  `,
})
export class ChatComponent implements AfterViewChecked {
  protected readonly activeOffcanvas = inject(NgbActiveOffcanvas);
  readonly chatService = inject(ChatService);

  @ViewChild('messagesContainer') private messagesContainer?: ElementRef<HTMLDivElement>;
  private lastMessageCount = 0;

  ngAfterViewChecked(): void {
    const count = this.chatService.messages().length;
    if (count !== this.lastMessageCount) {
      this.lastMessageCount = count;
      this.scrollToBottom();
    }
  }

  onMessageSent(text: string): void {
    this.chatService.processMessage(text);
  }

  private scrollToBottom(): void {
    const el = this.messagesContainer?.nativeElement;
    if (el) el.scrollTop = el.scrollHeight;
  }
}
