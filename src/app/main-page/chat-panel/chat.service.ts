import { HttpClient } from '@angular/common/http';
import { Injectable} from '@angular/core';
import { NavigationStart, Router } from '@angular/router';
import { HttpParams } from '@angular/common/http';
import { BehaviorSubject, takeUntil, zipWith, debounceTime, Observable, merge, of, timer, map, switchMap, distinctUntilChanged, delayWhen, startWith, skip, Subject, interval } from 'rxjs';
import { FriendsService } from '../friends-panel/friends.service';
import { ConversationsService, Conversation} from '../conversations-panel/conversations.service';
@Injectable({
  providedIn: 'root'
})

export class ChatService {

  public userMessage$: BehaviorSubject<string> = new BehaviorSubject<string>('');
  public currentConversation$: BehaviorSubject<Conversation | null> = new BehaviorSubject<Conversation | null>(null);
  
  private currentConversation: Conversation | null = null;
  private isUserTyping: boolean = false;

  private webSocket = new Socket();

  static _conversationService: ConversationsService;

  constructor(private httpClient: HttpClient, private friendsService: FriendsService, private conversationsService: ConversationsService) { 

    //set statics
    ChatService._conversationService = this.conversationsService;

    //get friends
    this.friendsService.getFriendsAndRequests();

    //subscribe to conversation change
    this.conversationsService.activeConversation$.subscribe((activeConversation: Conversation) => {
      this.currentConversation$.next(activeConversation)
      this.currentConversation = activeConversation;
    });

    //subscribe to updating all conversations (for pooling purposer mainly)
    this.conversationsService.conversations$.subscribe(conversations => {
      if(Array.isArray(conversations) && conversations.length > 0 && conversations[0].id && this.currentConversation){
        
        //find and update only current conversation, here we can always search by ID, for public and groups
        const newCurrentConversation = (conversations as Array<Conversation>).find(conversation => conversation.id === this.currentConversation!.id);
        
        if(newCurrentConversation) {

          //set saved messages to new conversation after pooling and then pool messages
          newCurrentConversation.messages = this.currentConversation.messages;

          this.currentConversation = newCurrentConversation;
          this.currentConversation$.next(newCurrentConversation);
        }
      }
    })


    this.userMessage$.pipe(
      switchMap(() => 
        merge(
          of(true),
          timer(500).pipe(map(() => false))
        )
      ),
      skip(2),
      distinctUntilChanged()
    ).pipe(debounceTime(600)).subscribe((isUserTyping) => {
      if(!this.currentConversation)
        return;

      this.isUserTyping = isUserTyping;
    });

    //interval for sending ws typing events
    interval(1000).subscribe(() => {

      if(!this.currentConversation || !this.isUserTyping)
        return;


      this.webSocket.emitEvent({
        eventType: WebSocketEventType.UserTyping,
        content: '',
        //subjectUsers: this.currentConversation.users.map(user => user.id),
        senderId: "", //to be replaced in backend
        conversationId: this.currentConversation.id,
        state: this.isUserTyping
      });
    })
  }

  //on message input change (when user is typing)
  public onMessageInputChange(message: string) {
    this.userMessage$.next(message);
  }

  //send message to conversation
  public sendMessage(conversation: Conversation, messageContent: string) {
    this.webSocket.emitEvent({
      eventType: WebSocketEventType.Message,
      content: messageContent,
      conversationId: conversation.id,
      senderId: "" //to be replaced in backend
    })
  }

  //set friend or conversation typing
  public static setTyping(typingEvent: TypingInfo) {


    //delegate to conversations service
    ConversationsService.setTyping(typingEvent, ChatService._conversationService);
  }

  //sync conversation on new message Ws event
  public static onMessage(messageEvent: WebSocketEvent) {
    const conversation = (ChatService._conversationService.conversations$.value as Array<Conversation>).find(conversation => conversation.id === messageEvent.conversationId);
    if(conversation){

      //stop typing
      ConversationsService.setTyping({conversationId: messageEvent.conversationId, senderId: messageEvent.senderId, typing: false}, ChatService._conversationService)

      //refresh messages
      //ChatService._conversationService.getConversationMessages(conversation);

      //refresh conversations
      ChatService._conversationService.getConversations();
    }

  }
}

//class for handling webSocket
class Socket {

  private webSocket!: WebSocket;
  public webSocketOpen$: BehaviorSubject<boolean> = new BehaviorSubject(false);
  public isTypingInfo: Array<BehaviorSubject<TypingInfo>> = [];

  constructor () {

    //connect to websocket
    this.webSocket = new WebSocket('ws://localhost:3000');

    this.webSocket.onopen = () => {
      this.webSocketOpen$.next(true);
    }

    this.webSocket.onclose = () => {
      this.webSocketOpen$.next(false);
    }

    this.webSocket.onmessage = (_event) => {
      const event = JSON.parse(_event.data.toString()) as WebSocketEvent;

      //switch event type
      switch (event.eventType) {

        //user started typing
        case WebSocketEventType.UserTyping: 

          ChatService.setTyping({conversationId: event.conversationId, senderId: event.senderId, typing: event.state});
        break;

        //user has sent message
        case WebSocketEventType.Message: 

          ChatService.onMessage(event);
        break;
      }
    }
  }

  public emitEvent(wsEvent: WebSocketEvent) {
    this.webSocket.send(JSON.stringify(wsEvent));
  }
}

enum WebSocketEventType {
  UserTyping = 'userTyping',
  Message = 'message'
}

interface WebSocketEvent {
  eventType: WebSocketEventType,
  content: string,
  conversationId: string,
  subjectUsers?: Array<string>, //participants IDs
  senderId: string,
  state?: any
}

export interface MessageEmojisSet {
  type: string //emoji type
  count: number
}

export type MessageState = 'sending' | 'sent' | 'red' | 'failed' | 'deleted';
export type MessageType = 'text' | 'file' | 'image' | 'video' | 'emoji' | 'deleted' | 'userAdded' | 'userRemoved' | 'nameChanged' | 'created'
export interface MessageInterface {
  senderId: string,
  content: string,
  timestamp: Date,
  emojis: Array<MessageEmojisSet>
  self: boolean,
  state?: MessageState,
  type?: MessageType
}

export interface TypingInfo {
  conversationId: string,
  senderId: string,
  typing: boolean
}


