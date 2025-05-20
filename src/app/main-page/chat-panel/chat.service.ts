import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { BehaviorSubject, debounceTime, Observable, merge, of, timer, map, switchMap, distinctUntilChanged, delayWhen, startWith, skip } from 'rxjs';
import { FriendsService } from '../friends-panel/friends.service';
import { ConversationsService, Conversation, MessageInterface } from '../conversations-panel/conversations.service';
@Injectable({
  providedIn: 'root'
})

export class ChatService {

  public messages: Array<MessageInterface> = [];
  public userMessage$: BehaviorSubject<string> = new BehaviorSubject<string>('');
  private currentConversation: Conversation | null = null;

  private webSocket = new Socket();

  constructor(private httpClient: HttpClient, private friendsService: FriendsService, private conversationsService: ConversationsService) { 

    //get friends
    this.friendsService.getFriendsAndRequests();

    //subscribe to conversation change
    this.conversationsService.activeConversation$.subscribe((activeConversation: Conversation) => {
      this.currentConversation = activeConversation;
      this.conversationsService.getConversationMessages(activeConversation);
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
    ).pipe(debounceTime(300)).subscribe((isUserTyping) => {
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
    console.log(message)
  }

  //TO BE DELETED
  //get conversation content (messages), search it by user and subject IDs
  // getConversationMessages(subjectId: string): Observable<{state: string, message: string, messages: Array<MessageInterface>}> {
  //   return this.httpClient.get<{state: string, message: string, messages: Array<MessageInterface>}>('api/express/conversations/getConversationMessages', {withCredentials: true, params: new HttpParams().set('subjectId', subjectId)})
  // }
  //
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

    this.webSocket.onmessage = (a) => {
      console.log(a)
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


