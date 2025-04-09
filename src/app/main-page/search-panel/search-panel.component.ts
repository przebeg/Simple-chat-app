import { Component } from '@angular/core';
import { FriendConversationLoadingPlaceholderComponent } from '../friend-conversation-loading-placeholder/friend-conversation-loading-placeholder.component';
import { FormControl, ReactiveFormsModule, FormGroup } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { HttpClient, HttpParams } from '@angular/common/http';

@Component({
  selector: 'search-panel',
  imports: [FriendConversationLoadingPlaceholderComponent, ReactiveFormsModule],
  templateUrl: './search-panel.component.html',
  styleUrl: './search-panel.component.css'
})
export class SearchPanelComponent {

  searchInProgress: boolean = false;
  searchBarFormControl: FormControl = new FormControl('');
  searchResults: Array<SearchResult> = [];

  constructor (private httpClient: HttpClient) {

    //on value change retrieve list of results with debounceTime
    this.searchBarFormControl.valueChanges.pipe(
      debounceTime(500)
    ).subscribe(inputValue => {

      this.searchInProgress = true;

      this.httpClient.get<{state: String, length: number, results: Array<SearchResult>}>('api/express/user/friends/searchUsers', {withCredentials: true, params: new HttpParams().set('searchQuery', inputValue)}).subscribe(response => {
        if(response.state === 'success'){
          this.searchResults = response.results;
          this.searchInProgress = false;
        }
      })

    })
  }
}

interface SearchResult {
  id: string,
  username: string
}
