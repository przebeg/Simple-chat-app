import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})

export class ChatServiceService {

  private webSocket!: WebSocket;

  constructor(private httpClient: HttpClient) { 
    return;

    //connect to websocket
    this.webSocket = new WebSocket('localhost:3000');

    this.webSocket.onopen = () => {
      console.log('WS Connection established');
    }

    this.webSocket.send('wiadomość');
  }

  //get conversation content (messages), search it by user and subject IDs
  getConversationMessages(subjectId: string) {

    this.httpClient.get<{state: string, message: string, massages: Array<MessageInterface>}>('api/express/conversations/getPrivateConversationMessages', {withCredentials: true, params: new HttpParams().set('subjectId', subjectId)}).subscribe(response => {

    })

  }
}


interface MessageEmojisSet {
  type: string //emoji type
  count: number
}

interface MessageInterface {
  senderId: string,
  content: string,
  timestamp: Date,
  emojis: Array<MessageEmojisSet> | null
}

export class Message {

  senderId: string;
  content: string;
  timestamp: Date;
  emojis: Array<MessageEmojisSet>;

  constructor (messageData: MessageInterface) {
    this.senderId = messageData.senderId;
    this.content = messageData.content;
    this.timestamp = messageData.timestamp;
    this.emojis = messageData.emojis?? [];
  }
  
}

interface Conversation {
  conversationId: string //just random string
  users: Array<string> //array of users participating in the conversation
  locked: boolean //is conversation locked (for some reason like friend deletion)
  messages: Array<MessageInterface>
}
