import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})

export class ChatService {

  private webSocket!: WebSocket;
  public webSocketOpen: BehaviorSubject<boolean> = new BehaviorSubject(false)

  public newChatsCount: BehaviorSubject<number> = new BehaviorSubject(0);
  public newFriendRequestsCount: BehaviorSubject<number> = new BehaviorSubject(0);

  public messages: Array<MessageInterface> = [];

  constructor(private httpClient: HttpClient) { 

    //connect to websocket
    this.webSocket = new WebSocket('ws://localhost:3000');

    this.webSocket.onopen = () => {
      this.webSocketOpen.next(true);
    }
  }

  //get conversation content (messages), search it by user and subject IDs
  getConversationMessages(subjectId: string): Observable<{state: string, message: string, messages: Array<MessageInterface>}> {
    return this.httpClient.get<{state: string, message: string, messages: Array<MessageInterface>}>('api/express/conversations/getConversationMessages', {withCredentials: true, params: new HttpParams().set('subjectId', subjectId)})
  }
}


interface MessageEmojisSet {
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


interface Conversation {
  conversationId: string //just random string
  users: Array<string> //array of users participating in the conversation
  locked: boolean //is conversation locked (for some reason like friend deletion)
  messages: Array<MessageInterface>
}
