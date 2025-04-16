import { Component } from '@angular/core';
import { FriendConversationLoadingPlaceholderComponent } from '../friend-conversation-loading-placeholder/friend-conversation-loading-placeholder.component';
import { HttpClient, HttpParams } from '@angular/common/http';
import {BehaviorSubject, Observable, Subject} from 'rxjs'

@Component({
  selector: 'friends-panel',
  imports: [FriendConversationLoadingPlaceholderComponent],
  templateUrl: './friends-panel.component.html',
  styleUrl: './friends-panel.component.css'
})

export class FriendsPanelComponent {

  placeholdersCount: Array<number> = new Array(6);
  
  friendsLoadingInProgress: boolean = true;
  friends: Array<FriendComponentData> = [];
  friendsRequests: Array<FriendRequestComponentData> = [];

  constructor(private httpClient: HttpClient) {

    //on begin get friends list
    this.getFriendsAndRequests();
  }

  //get list of all friends and friend requests at render (in constructor)
  getFriendsAndRequests() {

    this.friendsLoadingInProgress = true;
    this.friends = [];
    this.friendsRequests = [];

    //get friends list
    this.httpClient.get<{state: string, friendsCount: number, friends: Array<Friend>, incomingFriendsRequests: Array<FriendRequest>}>('api/express/user/friends/getFriendsList', {withCredentials: true}).subscribe(response => {
      if(response.state === 'success'){

        //convert Friends to FriendComponentData
        this.friends = response.friends.map(friend => {return({
          ...friend,
          buttonsDisabled: false,
          actionInProgress: false,
          removeFreidnButtonLoading: false
        })});
        this.friends.forEach(friend => this.setLastActiveMessage(friend));

        //make Component data of FriendRequest
        this.friendsRequests = response.incomingFriendsRequests.map(friendRequest => {return({
          ...friendRequest,
          actionInProgress: false,
          buttons: {
            reject: {disabled: false, loading: false},
            accept: {disabled: false, loading: false},
          }
        })});

        this.friendsLoadingInProgress = false;
      } 
    });
  }

  //set last active message string
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

  //decline friend request
  declineFriendRequest(friendRequest: FriendRequestComponentData) {
    if(friendRequest.actionInProgress)
      return;

    friendRequest.actionInProgress = true;
    const button = friendRequest.buttons.reject;
     
    button.loading = true;
    friendRequest.buttons.accept.disabled = true;

    //decline request
    this.httpClient.delete<{state: string, message: string}>('api/express/user/friends/declineFriendRequest', {withCredentials: true, params: new HttpParams().set('friendRequestUserId', friendRequest.id)}).subscribe(response => {
      console.log(response)
      if(response.state === 'success'){
        
        //friend request rejected
        const rejectedFriendIndex = this.friendsRequests.findIndex(friendRequestArr => friendRequestArr.id === friendRequest.id);

        if(rejectedFriendIndex >= 0)
          this.friendsRequests.splice(rejectedFriendIndex, 1);

      }
      else{
        friendRequest.actionInProgress = false;
        button.loading = false;
        friendRequest.buttons.accept.disabled = false;
      }
    });
   }

  //accept friend request
  acceptFriendRequest(friendRequest: FriendRequestComponentData) {
    if(friendRequest.actionInProgress)
      return;

    friendRequest.actionInProgress = true;
    const button = friendRequest.buttons.accept;
     
    button.loading = true;
    friendRequest.buttons.reject.disabled = true;

    //accept request
    this.httpClient.put<{state: string, message: string}>('api/express/user/friends/acceptFriendRequest', {friendRequestUserId: friendRequest.id}, {withCredentials: true}).subscribe(response => {
      if(response.state === 'success'){

        //friend request was accepted, refresh component
        this.getFriendsAndRequests();
      }
      else{
        friendRequest.actionInProgress = false;
        button.loading = false;
        friendRequest.buttons.reject.disabled = false;
      }
    });
  }

  //remove friend
  removeFriend(friend: FriendComponentData) {
    if(friend.actionInProgress)
      return;

    friend.actionInProgress = true;
    friend.removeFreidnButtonLoading = true;
    friend.buttonsDisabled = true;

    //remove friend http request
    this.httpClient.delete<{state: string, message: string}>('api/express/user/friends/removeFriend', {withCredentials: true, params: new HttpParams().set('friendUserId', friend.id)}).subscribe(response => {
      if(response.state === 'success'){
        console.log('x')
        //on response success refresh friends list
        this.getFriendsAndRequests();
      }
      else{
        friend.actionInProgress = false;
        friend.removeFreidnButtonLoading = false;
        friend.buttonsDisabled = false;
      }
    });

  }
}

interface Friend {
  id: string,
  active: boolean,
  username: string,
  message: string,
  activeNow: boolean,
  lastActive: Date,
}

interface FriendComponentData extends Friend {
  buttonsDisabled: boolean,
  actionInProgress: boolean,
  removeFreidnButtonLoading: boolean
}

interface FriendRequest {
  id: string,
  username: string
}

interface FriendRequestComponentData extends FriendRequest {
  actionInProgress: boolean,
  buttons: {
    reject: {
      disabled: boolean,
      loading: boolean
    },
    accept: {
      disabled: boolean,
      loading: boolean
    },
  }
}

