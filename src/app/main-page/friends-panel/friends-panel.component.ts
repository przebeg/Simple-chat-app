import { Component } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { FriendComponent } from './friend/friend.component';
import { FriendConversationLoadingPlaceholderComponent } from '../friend-conversation-loading-placeholder/friend-conversation-loading-placeholder.component';
import { HttpClient } from '@angular/common/http';
import {BehaviorSubject, Observable, Subject} from 'rxjs'

@Component({
  selector: 'friends-panel',
  imports: [FriendComponent, FriendConversationLoadingPlaceholderComponent],
  templateUrl: './friends-panel.component.html',
  styleUrl: './friends-panel.component.css'
})

export class FriendsPanelComponent {

  placeholdersCount: Array<number> = new Array(6);
  
  firendsAcquired: boolean = false;
  friends$: Subject<Array<Friend>> = new Subject();
  friends: Array<Friend> = [];
  friendsRequests: Array<string> = [];

  constructor(private httpClient: HttpClient) {

    //get friends list
    httpClient.get<{state: string, friendsCount: number, friends: Array<Friend>, incommingFriendsRequests: Array<string>}>('api/express/user/friends/getFriendsList', {withCredentials: true}).subscribe(response => {
      if(response.state === 'success'){

        this.friends = response.friends;
        this.friends.forEach(friend => this.setLastActiveMessage(friend))
        this.friendsRequests = response.incommingFriendsRequests;

        this.firendsAcquired = true;
      } 
    });
  }

  setLastActiveMessage(friend: Friend) {

    const timeDiff = Date.now() - new Date(friend.lastActive).getTime();
    friend.activeNow = false;

    //if last active < 1m
    if(timeDiff / 1000 < 60){
      friend.message= 'Active Now';
      friend.activeNow = true;
    }

    //last active >1m && <1h
    else if(timeDiff / (1000 * 60) < 60)
      friend.message = `Last active ${Math.floor(timeDiff / (1000 * 60))} min ago`;

    //last active <1d && >1h
    else if(timeDiff / (1000 * 60 * 60) < 24)
      friend.message = `Last active ${Math.floor(timeDiff / (1000 * 60 * 60))}h ago`;

    //last active >1d
    else if(timeDiff / (1000 * 60 * 24) >= 24)
      friend.message = `Last active ${Math.floor(timeDiff / (1000 * 60 * 60 * 24))}d ago`;
  }
}

export interface Friend {
  id: string,
  active: boolean,
  username: string,
  message: string,
  activeNow: boolean,
  lastActive: Date
}

