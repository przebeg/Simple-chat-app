import { Component } from '@angular/core';
import { FriendComponent } from './friend/friend.component';
import { FriendConversationLoadingPlaceholderComponent } from '../friend-conversation-loading-placeholder/friend-conversation-loading-placeholder.component';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'friends-panel',
  imports: [FriendComponent, FriendConversationLoadingPlaceholderComponent],
  templateUrl: './friends-panel.component.html',
  styleUrl: './friends-panel.component.css'
})

export class FriendsPanelComponent {
  
  friends: Array<Friend> = [];

  constructor(private httpClient: HttpClient) {
    httpClient.get<{state: string, friendsCount: number, friends: Array<Friend>}>('api/express/user/friends/getFriendsList', {withCredentials: true}).subscribe(response => {
      if(response.state === 'success'){
        this.friends = [...response.friends];
        console.log(response.friends)
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
