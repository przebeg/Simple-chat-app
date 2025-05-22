import { Component } from '@angular/core';
import { ChatService, MessageInterface} from './chat.service';
import { Conversation, ConversationsService } from '../conversations-panel/conversations.service';
import { NavigationEnd, Router } from '@angular/router';
import { BehaviorSubject, debounceTime, filter, Observable, Subject } from 'rxjs';
import { ConversationHTMLData, ConversationsPanelComponent } from '../conversations-panel/conversations-panel.component';
import { FriendsService } from '../friends-panel/friends.service';

@Component({
  selector: 'chat-panel',
  imports: [],
  templateUrl: './chat-panel.component.html',
  styleUrl: './chat-panel.component.css'
})

export class ChatPanelComponent {

  public messages: Array<MessageInterface> = [];
  public currentConversation: Conversation | null = null;
  public typedMessage$: BehaviorSubject<string> = new BehaviorSubject('');

  //html bindings elements
  public conversationTitle: string = '';
  public conversationSubtitle: string = '';
  public conversationImageQuery: string = '';
  public conversationActiveNow: boolean = false;

  constructor (private friendsService: FriendsService, private chatService: ChatService, private conversationsService: ConversationsService, private router: Router) {

    //on active conversation change
    this.chatService.currentConversation$.subscribe(_currentConversation => {
      this.currentConversation = _currentConversation;
      this.messages = this.currentConversation?.messages!;

      //get conversationsHTMLData from conversationsService and friendsService
      if(this.conversationsService.conversationsData$.value){
        const _conversation = this.conversationsService.conversationsData$.value.find(conversation => conversation.id === this.currentConversation!.id)

        //bind to html
        this.conversationTitle = _conversation?.conversationName!;
        this.conversationImageQuery = _conversation?.conversationImageQuery!;
        if(_conversation?.activeAvailable)
          this.conversationSubtitle = this.getLastActiveMessage(_conversation!)
        else
          this.conversationSubtitle = '';
      }

    });

  }

  //on user typing
  public messageInputChange(event: any) {
    this.chatService.userMessage$.next(event.target.value);
  }

  //build last active text
  private getLastActiveMessage(conversation: ConversationHTMLData): string {

    const timeDiff = Date.now() - new Date(conversation.lastActive).getTime();

    this.conversationActiveNow = false;

    //if last active < 1m
    if(timeDiff / 1000 < 60){
      this.conversationActiveNow = true;
      return 'Active now';
    }

    //last active >1m && <1h
    else if(timeDiff / (1000 * 60) < 60)
      return `Last active ${Math.floor(timeDiff / (1000 * 60))} min ago`;

    //last active <1d && >1h
    else if(timeDiff / (1000 * 60 * 60) < 24)
      return `Last active ${Math.floor(timeDiff / (1000 * 60 * 60))}h ago`;

    //last active >1d
    else if(timeDiff / (1000 * 60 * 24) >= 24)
      return `Last active ${Math.floor(timeDiff / (1000 * 60 * 60 * 24))}d ago`;

    return '';
  }
}


