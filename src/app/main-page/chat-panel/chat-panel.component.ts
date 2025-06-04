import { Component } from '@angular/core';
import { ChatService, MessageInterface} from './chat.service';
import { Conversation, ConversationsService } from '../conversations-panel/conversations.service';
import { NavigationEnd, Router } from '@angular/router';
import { BehaviorSubject, debounceTime, filter, interval, Observable, Subject } from 'rxjs';
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
      console.log(this.messages)

      //get message groups
      if(this.currentConversation)
        this.messageGroups = this.getMessagesGroups(this.currentConversation);

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

    //pool messages - TO CHANGE TO RACE WITH WS MESSAGE EVENT
    interval(3000).subscribe(() => {
      if(this.currentConversation)
        this.conversationsService.getConversationMessages(this.currentConversation);
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

    //cheking loop
    for(let i = startMessageIndex; i < conversationMessages.length; i++){
      if(conversationMessages[i].senderId !== sender!.id){
        result.push(i - 1);

        if(!conversationMessages[i].self)
          sender = conversationUsers.find(user => user.id === conversationMessages[i].senderId);
      }
    }

    //check for last message
    if(!conversationMessages.at(-1)?.self)
      result.push(conversationMessages.length - 1);

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

  //get message's style display (inner, outer-bottom, outer-top)
  public getMessageOrderStyleClass(conversation: Conversation, messageIndex: number): string {
    
    const messages = conversation.messages;
    const message = conversation.messages[messageIndex];

    if(messages && messages.length > 1){
      
      //search messages group first
      if(this.messageGroups.includes(messageIndex) && messageIndex > 0 && !message.self && messages[messageIndex - 1].senderId === message.senderId)
        return 'outer-bottom 1';

      //check if messageIndex is marginal
      if(messageIndex === 0){
        if(messages[1].senderId === message.senderId)
          return 'outer-top 2';
        return '';
      }
      if(messageIndex === messages.length - 1){
        if(messages[messageIndex - 1].senderId === message.senderId)
          return 'outer-bottom 3';
        return '';
      }

      //check previous and next messages
      if(messages[messageIndex - 1].senderId === message.senderId){
        if(messages[messageIndex + 1].senderId === message.senderId)
          return 'inner';
        return 'outer-bottom 4';
      }
      if(messages[messageIndex + 1].senderId === message.senderId)
        return 'outer-top 5';
      return '';
    }
      return '';
  }

  //send message
  private sendMessage(messageContent: string) {

    //send via service
    if(this.currentConversation)
      this.chatService.sendMessage(this.currentConversation, messageContent)
  }

}
