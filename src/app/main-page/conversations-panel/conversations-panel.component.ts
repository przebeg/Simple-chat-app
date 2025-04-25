import { Component } from '@angular/core';
import { FriendConversationLoadingPlaceholderComponent } from '../friend-conversation-loading-placeholder/friend-conversation-loading-placeholder.component';
import { HttpClient} from '@angular/common/http';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ConversationsService, Conversation } from './conversations.service';
import { debounceTime } from 'rxjs';

@Component({
  selector: 'conversations-panel',
  imports: [FriendConversationLoadingPlaceholderComponent, ReactiveFormsModule],
  templateUrl: './conversations-panel.component.html',
  styleUrl: './conversations-panel.component.css'
})
export class ConversationsPanelComponent {

  //external - friends

  isPlaceholder: boolean = false;
  placeholderClass: string = 'empty'; //empty or not-found
  searchInProgress: boolean = false;
  loadingPlaceholdersCount: Array<number> = new Array(6);

  searchFormControl: FormControl = new FormControl('');

  conversations: Array<ConversationHTMLData> = [];

  constructor (private httpClient: HttpClient, private conversationsService: ConversationsService) {
    
    //on conversation$ update
    this.conversationsService.conversations$.subscribe(conversations => {
      this.conversations = (conversations as Array<Conversation>).map(conversation => {return({
        ...conversation,
        conversationImageQuery: this.conversationBackgroundStyleQuery(conversation),
        conversationName: this.conversationNameBuilder(conversation),
        message: this.conversationLastMessageBuilder(conversation),
        activeNow: this.getActiveNow(conversation)
      })});
    });

    //search conversation with search bar, searching by conversation name
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

  private conversationLastMessageBuilder(conversation: Conversation): string {

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
      message += `${lastMessageDate.toLocaleString('en-US', {month: 'short'})} ${lastMessageDate.getDate()}${getDaySuffix(lastMessageDate.getDate())}`

    return message;
  }

  //get active now as bool, in future get last active time text
  private getActiveNow(conversation: Conversation): boolean {

    if(conversation.activeAvailable)
      return(Date.now() - conversation.lastActive.getTime() < (60 * 1000)) //if less than 1 minute
    else return false
  }

}

interface ConversationHTMLData extends Conversation {
  conversationImageQuery: string,
  conversationName: string,
  message: string,
  activeNow: boolean,
}

