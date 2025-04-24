import { Component } from '@angular/core';
import { FriendConversationLoadingPlaceholderComponent } from '../friend-conversation-loading-placeholder/friend-conversation-loading-placeholder.component';
import {interval, Observable} from 'rxjs'
import { FriendsService, Friend, FriendRequest } from './friends.service';

@Component({
  selector: 'friends-panel',
  imports: [FriendConversationLoadingPlaceholderComponent],
  templateUrl: './friends-panel.component.html',
  styleUrl: './friends-panel.component.css'
})

export class FriendsPanelComponent {

  placeholdersCount: Array<number> = new Array(6);
  
  friendsLoadingInProgress: boolean;
  friends: Array<FriendComponentData> = [];
  friendsRequests: Array<FriendRequestComponentData> = [];
  allowPlaceholder: boolean;

  constructor(private friendsService: FriendsService) {

    //allow placeholder
    this.allowPlaceholder = this.friendsService.allowPlaceholder$.value;
    this.friendsService.allowPlaceholder$.subscribe(value => this.allowPlaceholder = value);

    //friends loading
    this.friendsLoadingInProgress = this.friendsService.friendsLoadingInProgress$.value;
    this.friendsService.friendsLoadingInProgress$.subscribe(value => this.friendsLoadingInProgress = value)

    //on begin get friends list
    this.parseFriends(this.friendsService.friends$.value);
    this.parseFriendRequests(this.friendsService.friendRequests$.value);

    //on friends and request list change parse
    this.friendsService.friends$.subscribe(friends => this.parseFriends(friends));
    this.friendsService.friendRequests$.subscribe(friendRequests => this.parseFriendRequests(friendRequests));

    //every 30s update friend's last active label
    interval(30000).subscribe(() => {
      this.friends.forEach(friend => this.setLastActiveMessage(friend));
    });
  }

  private parseFriends(_friends: Array<Friend>) {
    this.friends = _friends.map(friend => {return({
      ...friend,
      buttonsDisabled: false,
      actionInProgress: false,
      removeFreidnButtonLoading: false
    })});
    this.friends.forEach(friend => this.setLastActiveMessage(friend));
  }

  private parseFriendRequests(_friendRequests: Array<FriendRequest>){
    this.friendsRequests = _friendRequests.map(friendRequest => {return({
      ...friendRequest,
      actionInProgress: false,
      buttons: {
        reject: {disabled: false, loading: false},
        accept: {disabled: false, loading: false},
      }
    })});
  }

  //set last active message string
  private setLastActiveMessage(friend: Friend) {

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
  public declineFriendRequest(friendRequest: FriendRequestComponentData) {
    if(friendRequest.actionInProgress)
      return;

    friendRequest.actionInProgress = true;
    const button = friendRequest.buttons.reject;
     
    button.loading = true;
    friendRequest.buttons.accept.disabled = true;
  }

  //accept friend request
  public acceptFriendRequest(friendRequest: FriendRequestComponentData) {
    if(friendRequest.actionInProgress)
      return;

    friendRequest.actionInProgress = true;
    const button = friendRequest.buttons.accept;
     
    button.loading = true;
    friendRequest.buttons.reject.disabled = true;

    //perform request
    this.friendsService.acceptFriendRequest(friendRequest.id);
  }

  //remove friend
  removeFriend(friend: FriendComponentData) {
    if(friend.actionInProgress)
      return;

    friend.actionInProgress = true;
    friend.removeFreidnButtonLoading = true;
    friend.buttonsDisabled = true;

    //remove friend http request
    this.friendsService.removeFriend(friend.id);
  }
}

interface FriendComponentData extends Friend {
  buttonsDisabled: boolean,
  actionInProgress: boolean,
  removeFreidnButtonLoading: boolean
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

