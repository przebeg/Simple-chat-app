import { HttpClient } from '@angular/common/http';
import { Injectable} from '@angular/core';
import { NavigationStart, Router } from '@angular/router';
import { HttpParams } from '@angular/common/http';
import { BehaviorSubject, filter, debounceTime, Observable, merge, of, timer, map, switchMap, distinctUntilChanged, delayWhen, startWith, skip, Subject } from 'rxjs';
import { FriendsService } from '../friends-panel/friends.service';
import { ConversationsService, Conversation} from '../conversations-panel/conversations.service';
@Injectable({
  providedIn: 'root'
})

export class ChatService {

  public userMessage$: BehaviorSubject<string> = new BehaviorSubject<string>('');
  public currentConversation$: BehaviorSubject<Conversation | null> = new BehaviorSubject<Conversation | null>(null);
  private currentConversation: Conversation | null = null;

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

        if(newCurrentConversation){
          this.currentConversation = newCurrentConversation;
          this.currentConversation$.next(newCurrentConversation);
        }
      }
    })

    //when user is typing
    this.userMessage$.pipe(
      switchMap(() => 
        merge(
          of(true),
          timer(500).pipe(map(() => false))
        )
      ),
      skip(1),
      distinctUntilChanged() 
    ).pipe(debounceTime(600)).subscribe((isUserTyping) => {
      if(!this.currentConversation)
        return;

      this.webSocket.emitEvent({
        eventType: WebSocketEventType.UserTyping,
        content: '',
        subjectId: this.currentConversation.type === 'private'? this.currentConversation.users[0].id : this.currentConversation.id,
        state: isUserTyping
      });
    });
  }

  //on message input change (when user is typing)
  public onMessageInputChange(message: string) {
    this.userMessage$.next(message);
  }

  //set friend or conversation typing
  public static setTyping(subjectId: string, isTyping: boolean) {

    //delegate to conversations service
    ConversationsService.setTyping(subjectId, isTyping, ChatService._conversationService);
  }
}

//class for handling webSocket
class Socket {

  private webSocket!: WebSocket;
  public webSocketOpen$: BehaviorSubject<boolean> = new BehaviorSubject(false);

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
        case WebSocketEventType.UserTyping: 

          console.log(event.subjectId)


          //set friend typing
          ChatService.setTyping(event.subjectId, event.state);
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
  subjectId: string,
  state: any
}

export interface MessageEmojisSet {
  type: string //emoji type
  count: number
}

export interface MessageInterface {
  senderId: string,
  content: string,
  timestamp: Date,
  emojis: Array<MessageEmojisSet>
  self: boolean
}


