import { Component } from '@angular/core';
import { FriendConversationLoadingPlaceholderComponent } from '../friend-conversation-loading-placeholder/friend-conversation-loading-placeholder.component';
import { HttpClient, HttpParams } from '@angular/common/http';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import {SsrCookieService} from 'ngx-cookie-service-ssr';

@Component({
  selector: 'conversations-panel',
  imports: [FriendConversationLoadingPlaceholderComponent, ReactiveFormsModule],
  templateUrl: './conversations-panel.component.html',
  styleUrl: './conversations-panel.component.css'
})
export class ConversationsPanelComponent {

  isPlaceholder: boolean = false;
  placeholderClass: string = 'empty'; //empty or not-found
  searchInProgress: boolean = false;
  loadingPlaceholdersCount: Array<number> = new Array(6);

  searchFormControl: FormControl = new FormControl('');

  conversations: Array<ConversationHTMLData> = [];

  constructor (private httpClient: HttpClient, private cookieService: SsrCookieService) {

    //at the start get conversations
    this.getConversations();

    console.log(cookieService.getAll())
  }

  //get conversations by query or all conversations when query === null
  getConversations(query: string | null = null) {
    if(this.searchInProgress)
      return;

    //filter query
    if(query === null || query.length < 3)
      query = '';

    this.searchInProgress = true;
    this.httpClient.get<{state: string, message: string, conversations: Array<Conversation>}>('api/express/conversations/getConversations', {withCredentials: true, params: new HttpParams().set('searchQuery', query)}).subscribe(response => {
      if(response.state === 'success'){

        this.searchInProgress = false;

        //if no conversations found
        this.conversations = response.conversations.map(conversation => {return({
          ...conversation,
          conversationImageQuery: this.conversationBackgroundStyleQuery(conversation),
          conversationName: this.conversationNameBuilder(conversation),
          message: this.conversationLastMessageBuilder(conversation)
        })});

        console.log(response.conversations);
        this.conversationLastMessageBuilder(this.conversations[0])
      }
    })
  }

  //build background image style query
  conversationBackgroundStyleQuery(conversation: Conversation): string {

    //if conversation is private (just one UserID should remain)
    if(conversation.type === 'private')
      return (`url(\'http://localhost:3000/api/express/data/profileImage/${conversation.users[0].id}\'), url(\'/assets/profile-image-placeholder.png\')`);

    //if conversation is group, query is empty
    if(conversation.type === 'group')
      return '';

    return ('url(\'/assets/profile-image-placeholder.png\')')
  }

  //build conversation name (if is not set)
  conversationNameBuilder(conversation: Conversation): string {

    //if name is set
    if(conversation.name.length > 0)
      return conversation.name;

    //if conversation is private (1 user only + this user)
    if(conversation.type === 'private')
      return conversation.users[0].username;

    //for group conversations without name
    if(conversation.type === 'group' && conversation.name.length === 0){

      //first 3 usernames
      if(conversation.users.length > 3)
        return conversation.users.map(user => user.username).slice(0, 2).join(', ') + `and ${conversation.users.length - 3} more`;
    
      //allusernames if users.length <= 3
      else
        return conversation.users.map(user => user.username).join(', ');
    }
    else if(conversation.type === 'group' && conversation.name.length > 0)
      return conversation.name;

    return '';
  }

  conversationLastMessageBuilder(conversation: Conversation): string {

    const lastMessage = conversation.lastMessage;
    const lastMessageDate = new Date(lastMessage.timestamp);
    let message: string = conversation.users.find(user => user.id === lastMessage.senderId)!.username + ': ' + lastMessage.content + ' · ';
    const timeDiff: number = Date.now() - lastMessageDate.getTime();

    //get day suffix
    const getDaySuffix = (day: number): string => {
      if(day % 10 === 1 && day !== 11)
        return 'st';
      if(day % 10 === 2 && day !== 12)
        return 'nd';
      if(day % 10 === 3 && day !== 13)
        return 'rd';

      return 'th'
    }

    //if message was sent less than minute ago
    if(timeDiff < (1000 * 60))
      message += 'now';

    //less than 12h
    else if(timeDiff < (1000 * 60 * 60 * 12))
      message += `${lastMessageDate.getHours()}:${lastMessageDate.getMinutes()}`;

    //more than 12h, display date
    else
      message += `${lastMessageDate.toLocaleString('en-US', {month: 'short'})} ${lastMessageDate.getDay() + getDaySuffix(lastMessageDate.getDay())}`

    return message;
  }

}


interface Conversation {
  id: string,
  users: Array<{id: string, username: string}>
  locked: boolean,
  lastMessage: {
    senderId: string,
    content: string,
    timestamp: Date,
    emojis: Array<string>
  }
  type: string,
  name: string
}

interface ConversationHTMLData extends Conversation {
  conversationImageQuery: string,
  conversationName: string,
  message: string
}

