import { Component } from '@angular/core';
import { ChatService, MessageInterface} from './chat.service';
import { Conversation, ConversationsService } from '../conversations-panel/conversations.service';
import { NavigationEnd, Router } from '@angular/router';
import { BehaviorSubject, debounceTime, filter, Observable, Subject } from 'rxjs';

@Component({
  selector: 'chat-panel',
  imports: [],
  templateUrl: './chat-panel.component.html',
  styleUrl: './chat-panel.component.css'
})

export class ChatPanelComponent {

  public messages: Array<MessageInterface> = [];
  private currentConversation: Conversation | null = null;
  public typedMessage$: BehaviorSubject<string> = new BehaviorSubject('');

  constructor (private chatService: ChatService, private conversationsService: ConversationsService, private router: Router) {

    this.chatService.currentConversation$.subscribe(_currentConversation => {
      this.currentConversation = _currentConversation;
      this.messages = this.currentConversation?.messages!;
      //console.log(_currentConversation)
    })
    

  }

  public messageInputChange(event: any) {
    this.chatService.userMessage$.next(event.target.value);
  }
}


