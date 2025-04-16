import { Component, Renderer2 } from '@angular/core';
import { FriendConversationLoadingPlaceholderComponent } from '../friend-conversation-loading-placeholder/friend-conversation-loading-placeholder.component';
import { FormControl, ReactiveFormsModule, FormGroup } from '@angular/forms';
import { debounceTime, delayWhen, distinctUntilChanged, timer } from 'rxjs';
import { HttpClient, HttpParams } from '@angular/common/http';

@Component({
  selector: 'search-panel',
  imports: [FriendConversationLoadingPlaceholderComponent, ReactiveFormsModule],
  templateUrl: './search-panel.component.html',
  styleUrl: './search-panel.component.css'
})
export class SearchPanelComponent {

  //number of placeholders
  placeholdersCount: Array<number> = new Array(6);

  searchInProgress: boolean = false;
  searchBarFormControl: FormControl = new FormControl('');
  searchResults: Array<SearchResultHTMLComponentData> = [];
  isPlaceholder: boolean = true;
  placeholderClass: string = 'empty'

  constructor (private httpClient: HttpClient) {

    //on value change retrieve list of results with debounceTime
    this.searchBarFormControl.valueChanges.pipe(debounceTime(500)).subscribe(inputValue => this.getSearchResults(inputValue));
  }
  
  //get/refresh search results
  getSearchResults(searchQuery: string) {

    if(searchQuery.length < 3){
      this.searchInProgress = false;
      this.searchResults = [];
      this.setPlaceholder(true, 'empty');
      return;
    }
    
    this.searchResults = [];
    this.searchInProgress = true;
    this.setPlaceholder(false);

    this.httpClient.get<{state: String, length: number, results: Array<SearchResult>}>('api/express/user/friends/searchUsers', {withCredentials: true, params: new HttpParams().set('searchQuery', searchQuery)}).pipe(delayWhen(() => timer(200))).subscribe(response => {
      if(response.state === 'success'){

        if(response.length === 0){
          this.searchInProgress = false;
          this.setPlaceholder(true, 'not-found');
          return;
        }

        //convert to SearchResultHTMLComponentData and save
        this.searchResults = response.results.map(responseResult => this.createSearchResultHTMLComponentData(responseResult));

        this.searchInProgress = false;
      }
    })
  }

  createSearchResultHTMLComponentData(searchResult: SearchResult): SearchResultHTMLComponentData {

    let buttonType: string = '';
    let message: string = '';

    if(searchResult.isFriend){
      buttonType = 'is-friend';
      message = 'You already are friends!';
    }
    else if(!searchResult.friendRequestIncomming && !searchResult.friendRequestOutgoing)
      buttonType = 'add-friend';
    else if(searchResult.friendRequestIncomming){
      buttonType = 'request-incoming';
      message = 'Wants to become your friend!'
    }
    else if(searchResult.friendRequestOutgoing){
      buttonType = 'request-outgoing';
      message = 'Friend request sent!'
    }

    return({
      ...searchResult,
      actionInProgress: false,
      buttonsType: buttonType,
      message: message,
      buttonLoading: false,
      buttons: {
        sendRequest: {
          loading: false
        },
        accept: {
          loading: false,
        },
        decline: {
          loading: false
        }
      }
    })
  }

  //on add friend button click
  sendFriendRequest(user: SearchResultHTMLComponentData) {

    if(user.actionInProgress)
      return;

    user.actionInProgress = true;
    user.buttons.sendRequest.loading = true;

    //send sendFriendRequest request
    this.httpClient.get<{state: string, message: string}>('api/express/user/friends/sendFriendRequest', {withCredentials: true, params: new HttpParams().set('userId', user.id)}).subscribe(response => {
      if(response.state === 'success'){
        user.buttonsType = 'request-outgoing';
        user.buttons.sendRequest.loading = false;
        user.actionInProgress = false;
        user.message = 'Friend request sent!';
      }
      else
        user.buttons.sendRequest.loading = false;
        user.actionInProgress = false;
    })
  }

  //set wrapper placeholder
  setPlaceholder(isPlaceholder: boolean = true, placeholderClass: string = '') {
    this.isPlaceholder = isPlaceholder;
    this.placeholderClass = placeholderClass;
  }

  //accept friend request
  acceptFriendRequest(requestUser: SearchResultHTMLComponentData) {

    console.log('x')
    
    if(requestUser.actionInProgress)
      return;

    requestUser.actionInProgress = true
    requestUser.buttons.accept.loading = true;

    //accept request
    this.httpClient.put<{state: string, message: string}>('api/express/user/friends/acceptFriendRequest', {friendRequestUserId: requestUser.id}, {withCredentials: true}).subscribe(response => {
      
      //refresh component
      this.getSearchResults(this.searchBarFormControl.value)
    });
  }

  //decline friend request
  declineFriendRequest(requestUser: SearchResultHTMLComponentData) {

    console.log('x')

    if(requestUser.actionInProgress)
      return;

    requestUser.actionInProgress = true
    requestUser.buttons.accept.loading = true;

    //decline request
    this.httpClient.delete<{state: string, message: string}>('api/express/user/friends/declineFriendRequest', {withCredentials: true, params: new HttpParams().set('friendRequestUserId', requestUser.id)}).subscribe(response => {
      
      //refresh component
      this.getSearchResults(this.searchBarFormControl.value)
    });
  }
}

interface SearchResult {
  id: string,
  username: string,
  isFriend: boolean,
  friendRequestOutgoing: boolean,
  friendRequestIncomming: boolean,
}

interface SearchResultHTMLComponentData extends SearchResult {
  actionInProgress: boolean,
  buttonsType: string,
  message: string,
  buttonLoading: boolean,
  buttons: {
    sendRequest: {
      loading: boolean
    }
    accept: {
      loading: boolean,
    },
    decline: {
      loading: boolean
    }
  }
}
