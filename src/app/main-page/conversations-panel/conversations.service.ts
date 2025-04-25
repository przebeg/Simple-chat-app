import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, race } from 'rxjs';
import { Friend, FriendsService } from '../friends-panel/friends.service';

@Injectable({
  providedIn: 'root'
})
export class ConversationsService {

  conversationsLoadingInProgress$: BehaviorSubject<boolean> = new BehaviorSubject(true);
  conversations$: BehaviorSubject<Array<Conversation> | any> = new BehaviorSubject([]);
  allowPlaceholder$: BehaviorSubject<boolean> = new BehaviorSubject(false);


  constructor(private httpClient: HttpClient, private friendsService: FriendsService) {

    //when friends$ update, update activeNows of conversations
    this.friendsService.friends$.subscribe(friends => {
     
      if(this.conversationsLoadingInProgress$.value || this.friendsService.friendsLoadingInProgress$.value)
        return;

      const _conversations = this.conversations$.value as Array<Conversation>;
      _conversations.forEach(conversation => this.getActiveAvailable(conversation));
      this.conversations$.next(this.conversations$.value);
    })
  }

  //get active available and last active of conversation. If type is Conversation, change argument object, else if ConversationResponse, return object
  private getActiveAvailable(conversation: Conversation | ConversationResponse): {activeAvailable: boolean, lastActive: Date} | void {

    let lastActiveTime: number = 0; //last active time when no friend in activeNow
    let activeUser: Friend | undefined;

    //get users from conversation that are friends as Friend
    const friendUsers = (this.friendsService.friends$.value as Array<Friend>).filter(friend => conversation.users.map(user => user.id).includes(friend.id));

    if(friendUsers.length > 0){

      //search if anyone from conversation is active
      activeUser = friendUsers.find(friend => friend.activeNow);

      if(!activeUser){

        //if no user is active now get the last active
        friendUsers.forEach(friendUser => {
           const time = (typeof(friendUser.lastActive) === "number"? friendUser.lastActive : friendUser.lastActive.getTime())
           if(time > lastActiveTime)
            lastActiveTime = time
        });
      }
      else lastActiveTime = -1;
    }

    //lastActiveTime: 0 when no friends in conversation, -1 when some user is active, number (time) of last active friend user
    let resultObject = (lastActiveTime === 0? {activeAvailable: false, lastActive: new Date(0)} : (lastActiveTime === -1? {activeAvailable: true, lastActive: (activeUser? activeUser.lastActive : new Date(Date.now()))} : {activeAvailable: true, lastActive: new Date(lastActiveTime)}));
    
    //if type is ConversationResponse, return data
    if(!('activeAvailable' in conversation))
      return resultObject;

    //else change argument object
    else {
      conversation.activeAvailable = resultObject.activeAvailable;
      conversation.lastActive = new Date(resultObject.lastActive);
    }
  }

  //get conversations
  public getConversations() {

    //request
    const response$ = this.httpClient.get<{state: string, message: string, conversations: Array<ConversationResponse>}>('api/express/conversations/getConversations', {
      withCredentials: true, 
    });
    
    response$.subscribe(response => {
      if(response.state === 'success'){
        this.conversations$.next(response.conversations.map(conversation => {return({
          ...conversation,
          ...(this.friendsService.friendsLoadingInProgress$.value? //if friends are loaded get activeNows, else set default
                {activeAvailable: false, lastActive: 0} :  
                this.getActiveAvailable(conversation))
        })}))

        this.conversationsLoadingInProgress$.next(false);
        this.allowPlaceholder$.next(!response.conversations || response.conversations.length === 0)
      }
    });

    //when friends and conversations are loaded get last active of conversations
    this.friendsService.friendsLoadingInProgress$.subscribe(value => {
      if(!value && this.conversations$.value.length > 3)
        this.conversations$.next((this.conversations$.value as Array<Conversation>).forEach(conversation => this.getActiveAvailable(conversation)));
    })

    //race
    // race([
    //   res
    // ])

  }
}

interface ConversationResponse {
  id: string,
  users: Array<{id: string, username: string}>
  locked: boolean,
  lastMessage: {
    senderId: string,
    content: string,
    timestamp: Date,
    emojis: Array<string>
  }
  type: string,
  name: string
}

export interface Conversation extends ConversationResponse {
  activeAvailable: boolean
  lastActive: Date
}
