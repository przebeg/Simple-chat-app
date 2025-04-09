import { Component } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { FriendComponent } from './friend/friend.component';
import { FriendConversationLoadingPlaceholderComponent } from '../friend-conversation-loading-placeholder/friend-conversation-loading-placeholder.component';
import { HttpClient } from '@angular/common/http';
import {BehaviorSubject, Observable, Subject} from 'rxjs'

@Component({
  selector: 'friends-panel',
  imports: [FriendComponent, FriendConversationLoadingPlaceholderComponent, AsyncPipe],
  templateUrl: './friends-panel.component.html',
  styleUrl: './friends-panel.component.css'
})

export class FriendsPanelComponent {
  
  firendsAcquired: boolean = false;
  friends$: Subject<Array<Friend>> = new Subject();
  friends: Array<Friend> = [];

  constructor(private httpClient: HttpClient) {

    //get friends list
    httpClient.get<{state: string, friendsCount: number, friends: Array<Friend>}>('api/express/user/friends/getFriendsList', {withCredentials: true}).subscribe(response => {
      if(response.state === 'success'){
        this.firendsAcquired = true;
        this.friends = response.friends;
        console.log(this.friends)
        this.friends$.next(response.friends);
      } 
    });
  }
}

export interface Friend {
  id: string,
  active: boolean,
  username: string,
  lastActive: Date
}
