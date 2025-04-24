import { Component } from '@angular/core';
import { ChatService, MessageInterface } from '../chat.service';
import { NavigationEnd, Router } from '@angular/router';
import { filter, Observable } from 'rxjs';

@Component({
  selector: 'chat-panel',
  imports: [],
  templateUrl: './chat-panel.component.html',
  styleUrl: './chat-panel.component.css'
})

export class ChatPanelComponent {

  conversationId: string = '';
  messages: Array<MessageInterface>;

  constructor (private chatService: ChatService, private router: Router) {

    this.messages = chatService.messages;

    //on navigation change get conversationId and messages
    this.router.events.pipe(filter(event => event instanceof NavigationEnd)).subscribe(event => {
      const _conversationId = event.urlAfterRedirects.split('@').at(-1)?? '';
      if(this.conversationId !== _conversationId){
        this.conversationId = _conversationId;
      }
    });

    //on messages update
    this.chatService.getConversationMessages(this.conversationId).subscribe(response => {
      this.messages = response.messages;
      console.log(this.messages)
    })
  }
}


