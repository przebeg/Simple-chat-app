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

  constructor (private httpClient: HttpClient, private renderer: Renderer2) {

    //on value change retrieve list of results with debounceTime
    this.searchBarFormControl.valueChanges.pipe(
      debounceTime(500)
    ).subscribe(inputValue => {

      if(inputValue.length < 3){
        this.searchInProgress = false;
        this.searchResults = [];
        this.setPlaceholder(true, 'empty');
        return;
      }
      
      this.searchResults = [];
      this.searchInProgress = true;
      this.setPlaceholder(false);

      this.httpClient.get<{state: String, length: number, results: Array<SearchResult>}>('api/express/user/friends/searchUsers', {withCredentials: true, params: new HttpParams().set('searchQuery', inputValue)}).pipe(delayWhen(() => timer(200))).subscribe(response => {
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
      buttonsType: buttonType,
      message: message,
      buttonLoading: false
    })
  }

  //on add friend button click
  sendFriendRequest(userId: string) {

    const resultSubjectIndex = this.searchResults.findIndex(result => result.id === userId);
    if(resultSubjectIndex < 0)
      return;

    const resultSubject = this.searchResults[resultSubjectIndex];
    resultSubject.buttonLoading = true;

    //send sendFriendRequest request
    this.httpClient.get<{state: string, message: string}>('api/express/user/friends/sendFriendRequest', {withCredentials: true, params: new HttpParams().set('userId', resultSubject.id)}).pipe(delayWhen(() => timer(200))).subscribe(response => {
      console.log(response);
    })
  }

  //set wrapper placeholder
  setPlaceholder(isPlaceholder: boolean = true, placeholderClass: string = '') {
    this.isPlaceholder = isPlaceholder;
    this.placeholderClass = placeholderClass;
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
  buttonsType: string,
  message: string,
  buttonLoading: boolean
}
