import { Component } from '@angular/core';
import { ChatService} from './chat.service';
import { ConversationsService, MessageInterface } from '../conversations-panel/conversations.service';
import { NavigationEnd, Router } from '@angular/router';
import { BehaviorSubject, debounceTime, filter, Observable } from 'rxjs';

@Component({
  selector: 'chat-panel',
  imports: [],
  templateUrl: './chat-panel.component.html',
  styleUrl: './chat-panel.component.css'
})

export class ChatPanelComponent {

  conversationId: string = '';
  messages: Array<MessageInterface>;
  typedMessage$: BehaviorSubject<string> = new BehaviorSubject('');

  constructor (private chatService: ChatService, private conversationsService: ConversationsService, private router: Router) {

    this.messages = chatService.messages;

  }

  public messageInputChange(event: any) {
    this.chatService.userMessage$.next(event.target.value);
  }
}


