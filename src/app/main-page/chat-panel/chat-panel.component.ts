import { Component, ViewChild, ElementRef, viewChild } from '@angular/core';
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

  @ViewChild('messageInput') messageInputElement: any;
  @ViewChild('chatsContainer') chatsContainerElement: any;

  public messages: Array<MessageInterface> = [];
  public currentConversation: Conversation | null = null;
  public messageGroups: Array<number> = new Array<number>(0);

  //html bindings elements
  public conversationTitle: string = '';
  public conversationSubtitle: string = '';
  public conversationImageQuery: string = '';
  public conversationActiveNow: boolean = false;
  public messageInputContent: string = '';
  public displayLastMessageGroupUserElement: boolean = true;

  private maxMessageLengt: number = 1000;

  constructor (private friendsService: FriendsService, private chatService: ChatService, private conversationsService: ConversationsService, private router: Router) {

    //on active conversation change
    this.chatService.currentConversation$.subscribe(_currentConversation => {

      if(!_currentConversation)
        return;
      
      this.currentConversation = _currentConversation;
      this.messages = this.currentConversation?.messages!;

      //get message groups
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


        //display or hide last group sender html user-element
        if(this.currentConversation.type === 'private' && !this.currentConversation.messages.at(-1)?.self && this.currentConversation.users[0].isTyping)
          this.displayLastMessageGroupUserElement = false;
        else
          this.displayLastMessageGroupUserElement = true;

        //if any user is typing scroll to bottom
        if(this.currentConversation.users.findIndex(user => user.isTyping) >= 0)
          this.scrollToBottom();
      }
    });

    //pool messages - TO CHANGE TO RACE WITH WS MESSAGE EVENT
    interval(3000).subscribe(() => {
      if(this.currentConversation)
        this.conversationsService.getConversationMessages(this.currentConversation);
    });

    //listen for request of chat scrolling to botton
    this.conversationsService.scrollChatToBottom$.subscribe(v => {
      if(v === true)
        this.scrollToBottom({force: true});
    })

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
    this.messageInputContent = event.target.value.toString();
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
        return 'outer-bottom';

      //check if messageIndex is marginal
      if(messageIndex === 0){
        if(messages[1].senderId === message.senderId)
          return 'outer-top';
        return '';
      }
      if(messageIndex === messages.length - 1){
        if(messages[messageIndex - 1].senderId === message.senderId)
          return 'outer-bottom';
        return '';
      }

      //check previous and next messages
      if(messages[messageIndex - 1].senderId === message.senderId){
        if(messages[messageIndex + 1].senderId === message.senderId)
          return 'inner';
        return 'outer-bottom';
      }
      if(messages[messageIndex + 1].senderId === message.senderId)
        return 'outer-top';
      return '';
    }
      return '';
  }

  //send message
  public sendMessage() {

    //get content and check
    if(this.messageInputContent.length > this.maxMessageLengt)
      //TO DO: When message length exceeds max length
      return;

    //send via service
    if(this.currentConversation && this.messageInputContent.length > 0){
      this.chatService.sendMessage(this.currentConversation, this.messageInputContent.toString());
      this.messageInputElement.nativeElement.value = '';
    }

    //make temp message to be viewed before syncing with server
    this.messages.push({
      senderId: 'null',
      content: this.messageInputContent,
      timestamp: new Date(Date.now()),
      emojis: [],
      self: true,
      state: 'sending'
    });

    //force scroll to bottom
    this.scrollToBottom({force: true});
  }

  //scroll chats container to bottom
  public scrollToBottom({force}: {force: boolean} = {force: false}) {

    setTimeout(() => {
      if(force){
        this.chatsContainerElement.nativeElement.scrollTop = this.chatsContainerElement.nativeElement.scrollHeight;
        return;
      }

      //if user has scrolled less than 50px scroll to bottom
      if(this.chatsContainerElement.nativeElement.scrollTop <= 50)
        this.chatsContainerElement.nativeElement.scrollTop = this.chatsContainerElement.nativeElement.scrollHeight;

    }, 0)
  }

}
