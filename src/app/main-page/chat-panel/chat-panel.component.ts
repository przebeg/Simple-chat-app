import { Component } from '@angular/core';
import { ChatService, MessageInterface} from './chat.service';
import { Conversation, ConversationsService } from '../conversations-panel/conversations.service';
import { NavigationEnd, Router } from '@angular/router';
import { BehaviorSubject, debounceTime, filter, Observable, Subject } from 'rxjs';
import { ConversationHTMLData, ConversationsPanelComponent } from '../conversations-panel/conversations-panel.component';
import { FriendsService } from '../friends-panel/friends.service';
import { User } from '../conversations-panel/conversations.service';

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
  public messageGroups: Array<number> = new Array<number>(0);

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

      //get message groups
      if(this.currentConversation){
        this.messageGroups = this.getMessagesGroups(this.currentConversation);
      }

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

  //get message groups - message sequences that were sent in a row by the same user
  private getMessagesGroups(conversation: Conversation): Array<number> {

    if(!conversation)
      return [];
    
    const result = new Array<number>(0);
    const conversationUsers = conversation.users;
    const conversationMessages = conversation.messages;

    //get first message's sender, omit this user TODO
    let startMessageIndex = conversationMessages.findIndex(message => !message.self);
    let sender = conversationUsers.find(user => user.id === conversationMessages[startMessageIndex].senderId);
    
    if(!sender)
      return [];

    for(let i = startMessageIndex; i < conversationMessages.length; i++){
      if(conversationMessages[i].senderId !== sender!.id){
        result.push(i - 1);

        if(!conversationMessages[i].self)
          sender = conversationUsers.find(user => user.id === conversationMessages[i].senderId);
      }
    }

    console.log(result)

    
    //find next change in message sender, then push to results and update current sender
    // this.currentConversation?.messages.forEach((message, messageIndex) => {
    //   if(message.senderId !== sender.id){
    //     result.push(messageIndex - 1);
    //     sender = conversationUsers.find(user => user.id === message.senderId)!;
    //   }
    // })

    return result;
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


