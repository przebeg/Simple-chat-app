import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, interval, take, race, tap, timer} from 'rxjs';
import { HttpParams } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class FriendsService {

  //friends and friend requests
  friends$: BehaviorSubject<Array<Friend> | any> = new BehaviorSubject([]);
  friendRequests$: BehaviorSubject<Array<FriendRequest> | any> = new BehaviorSubject([]);
  friendsLoadingInProgress$: BehaviorSubject<boolean> = new BehaviorSubject(false);
  allowPlaceholder$: BehaviorSubject<boolean> = new BehaviorSubject(false);

  constructor(private httpClient: HttpClient) {}

  //get friends and friend requests
  public getFriendsAndRequests() {

    //request
    const response$ = this.httpClient.get<{state: string, friendsCount: number, friends: Array<Friend>, incomingFriendsRequests: Array<FriendRequest>}>('api/express/user/friends/getFriendsList',{
      withCredentials: true
    });
    response$.subscribe(response => {
      if(response.state === 'success'){
        this.friends$.next(response.friends);
        this.friendRequests$.next(response.incomingFriendsRequests);
        this.friendsLoadingInProgress$.next(false);
        this.allowPlaceholder$.next(response.friends.length === 0 && response.incomingFriendsRequests.length === 0);

        //pooling for silent friends list update
        interval(5000).subscribe(() => this.updateFriendsListSilent())
      }
    });
    
    //when request takes longer than timer(), display loading screen
    race([
      response$,
      timer(500).pipe(tap(() => this.friendsLoadingInProgress$.next(true)))
    ]).subscribe();
  }

  //silent update friends list
  public updateFriendsListSilent() {
    console.log('x')
    //request
    this.httpClient.get<{state: string, friendsCount: number, friends: Array<Friend>, incomingFriendsRequests: Array<FriendRequest>}>('api/express/user/friends/getFriendsList',{
      withCredentials: true
    }).subscribe(response => {
      if(response.state === 'success'){
        this.friends$.next(response.friends);
        this.friendRequests$.next(response.incomingFriendsRequests);
        this.allowPlaceholder$.next(response.friends.length === 0 && response.incomingFriendsRequests.length === 0);
      }
    })
  }

  //decline friend request
  public declineFriendRequest(requestUserId: string) {
    this.httpClient.delete<{state: string, message: string}>('api/express/user/friends/declineFriendRequest', {
      withCredentials: true,
      params: new HttpParams().set('friendRequestUserId', requestUserId)
    }).subscribe(response => {
      
      //on response refresh friends
      this.getFriendsAndRequests();
    });
  }

  //accept friend request
  public acceptFriendRequest(requestUserId: string) {
    this.httpClient.put<{state: string, message: string}>('api/express/user/friends/acceptFriendRequest', {
      friendRequestUserId: requestUserId, 
      withCredentials: true
    }).subscribe(response => {

      //on response refresh friends
      this.getFriendsAndRequests();
    });
  }

  //remove friend
  public removeFriend(friendId: string) {
    this.httpClient.delete<{state: string, message: string}>('api/express/user/friends/removeFriend', {
      withCredentials: true, 
      params: new HttpParams().set('friendUserId', friendId)
    }).subscribe(response => {
      
      //on response refresh friends list
      this.getFriendsAndRequests();
    })
  }
}

export interface Friend {
  id: string,
  active: boolean,
  username: string,
  message: string,
  activeNow: boolean,
  lastActive: Date,
}

export interface FriendRequest {
  id: string,
  username: string
}
