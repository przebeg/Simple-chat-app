import { Component, Inject } from '@angular/core';
import { FriendConversationLoadingPlaceholderComponent } from '../friend-conversation-loading-placeholder/friend-conversation-loading-placeholder.component';
import { HttpClient} from '@angular/common/http';
import { ControlEvent, FormControl, ReactiveFormsModule } from '@angular/forms';
import { ConversationsService, Conversation } from './conversations.service';
import { BehaviorSubject, debounceTime, Subject, filter } from 'rxjs';
import { Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';

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

  constructor (@Inject(PLATFORM_ID) private platformId: Object, private router: Router, private httpClient: HttpClient, private conversationsService: ConversationsService) {
    
    //on conversation$ update
    this.conversationsService.conversations$.subscribe(conversations => {
      this.conversations = (conversations as Array<Conversation>).map(conversation => {return({
        ...conversation,
        conversationImageQuery: this.conversationBackgroundStyleQuery(conversation),
        conversationName: this.conversationNameBuilder(conversation),
        message: this.conversationLastMessageBuilder(conversation),
        activeNow: this.getActiveNow(conversation),
        isTyping: conversation.users.filter(user => user.isTyping).length > 0,
        isTypingText: this.typingMessageBuilder(conversation)
      })});

      //export data (via conversations service)
      //this.conversationsService.conversationsData$.next(this.conversations); ??????
    });

    //search conversation with search bar, searching by conversation name TODO
    this.searchFormControl.valueChanges.pipe(debounceTime(300)).subscribe(searchQuery => {
      if(searchQuery.length < 3) //minimum 3 chars
        return;

      const _conversations = this.conversations.filter(conversation => conversation.conversationName.includes(searchQuery));
        
    })
  }

  //build background image style query
  private conversationBackgroundStyleQuery(conversation: Conversation): string {

    //if conversation is private (just one UserID should remain)
    if(conversation.type === 'private')
      return (`url(\'http://localhost:3000/api/express/data/profileImage/${conversation.users[0].id}\'), url(\'/assets/profile-image-placeholder.png\')`);

    //if conversation is group, query is empty
    if(conversation.type === 'group')
      return '';

    return ('url(\'/assets/profile-image-placeholder.png\')')
  }

  //build conversation name (if is not set)
  private conversationNameBuilder(conversation: Conversation): string {

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

  //build last message of conversation
  private conversationLastMessageBuilder(conversation: Conversation): string {

    const lastMessage = conversation.lastMessage;
    const lastMessageDate = new Date(lastMessage.timestamp);
    const lastMessageUserIndex = conversation.users.findIndex(user => user.id === lastMessage.senderId)!;
    let lastMessageUserUsername: string;
    let _lastMessageContent: string = lastMessage.content;

    //check if last message was sent by this user
    if(lastMessageUserIndex < 0)
      lastMessageUserUsername = 'You';
    else
      lastMessageUserUsername = conversation.users[lastMessageUserIndex].username;

    //trim user and message text
    const maxCombinedLenght = 40;
    const maxSingleLength = 30;
    if(lastMessageUserUsername.length > maxSingleLength){
      lastMessageUserUsername = lastMessageUserUsername.substring(0, maxSingleLength - 4) + '... ';
      if(lastMessageUserUsername.length + _lastMessageContent.length > maxCombinedLenght)
        _lastMessageContent = _lastMessageContent.substring(0, 6) + '...';
    }
    if(_lastMessageContent.length > maxSingleLength){
      _lastMessageContent = _lastMessageContent.substring(0, maxSingleLength - 4) + '...';
    }

    let message: string = lastMessageUserUsername + ': ' + _lastMessageContent + ' · ';
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
      message += `${lastMessageDate.toLocaleString('en-US', {month: 'short'})} ${lastMessageDate.getDate()}${getDaySuffix(lastMessageDate.getDate())}`

    return message;
  }

  //get active now as bool, in future get last active time text
  private getActiveNow(conversation: Conversation): boolean {

    if(conversation.activeAvailable)
      return(Date.now() - conversation.lastActive.getTime() < (60 * 1000)) //if less than 1 minute
    else return false
  }

  //build ...typing message
  private typingMessageBuilder(conversation: Conversation): string {

    switch(conversation.type){
      case 'private':
        if(conversation.users[0].isTyping)
          return `${conversation.users[0].username} is typing...`;
        else return '';
      break;
      
      case 'group':
        if(conversation.users.filter(user => user.isTyping).length === 0)
          return '';
        else if(conversation.users.filter(user => user.isTyping).length === 1)
          return `${conversation.users.find(user => user.isTyping === true)?.username} is typing...`;
        else if(conversation.users.filter(user => user.isTyping).length > 1)
          return 'Several people are typing...'
        return '';
      break;

      default: return '';
    }
  
  }

  //navigate to clicked conversation
  public conversationClick(conversation: Conversation) {

    //set to localStorage
    if(window.localStorage && isPlatformBrowser(this.platformId))
      window.localStorage.setItem('lastActiveConversation', conversation.type === 'private'? conversation.users[0].id : conversation.id);

    //navigate
    this.router.navigate(['conversations', `@${conversation.type === 'private'? conversation.users[0].id: conversation.id}`]);

    //change active conversation in service
    this.conversationsService.setActiveConversation(conversation)
  }

}

export interface ConversationHTMLData extends Conversation {
  conversationImageQuery: string,
  conversationName: string,
  message: string,
  activeNow: boolean,
  isTyping: boolean,
  isTypingText: string
}

