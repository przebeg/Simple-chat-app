import { Component } from '@angular/core';
import { FriendConversationLoadingPlaceholderComponent } from '../friend-conversation-loading-placeholder/friend-conversation-loading-placeholder.component';
import { HttpClient, HttpParams } from '@angular/common/http';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

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

  conversations: Array<Conversation> = [];

  constructor (private httpClient: HttpClient) {

    //at the start get conversations
    this.getConversations();
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
      console.log(response);
      if(response.state === 'success'){

        this.searchInProgress = false;

        //if no conversations found
        this.conversations = response.conversations
      }
    })
  }

}

interface Conversation {
  id: string,
  users: Array<string>,
  locked: boolean,
  type: string,
  name: string
}
