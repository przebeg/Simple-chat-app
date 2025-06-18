import { HttpClient } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { BehaviorSubject, last, Subject, merge, timer, map, interval, switchMap, take, takeUntil, Observable} from 'rxjs';
import { Friend, FriendsService } from '../friends-panel/friends.service';
import { SsrCookieService } from 'ngx-cookie-service-ssr';
import { Router } from '@angular/router';
import { HttpParams } from '@angular/common/http';
import { ChatService, MessageInterface, MessageType, TypingInfo } from '../chat-panel/chat.service';
import { ConversationHTMLData } from './conversations-panel.component';
import { PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Interface } from 'readline';

@Injectable({
  providedIn: 'root'
})
export class ConversationsService {

  conversationsLoadingInProgress$: BehaviorSubject<boolean> = new BehaviorSubject(true);
  conversations$: BehaviorSubject<Array<Conversation> | any> = new BehaviorSubject([]);
  allowPlaceholder$: BehaviorSubject<boolean> = new BehaviorSubject(false);
  activeConversation$: Subject<Conversation> = new Subject();

  public scrollChatToBottom$: Subject<boolean> = new Subject<boolean>(); //scroll chat to bottom on current conversation switch

  //for data export
  public conversationsData$: BehaviorSubject<Array<ConversationHTMLData>> = new BehaviorSubject<Array<ConversationHTMLData>>([]);

  private static _conversations: Array<Conversation> = [];

  constructor(@Inject(PLATFORM_ID) private platformId: Object, private router: Router, private httpClient: HttpClient, private friendsService: FriendsService, private ssrCookieService: SsrCookieService) {

    //get conversations
    this.getConversations();
    
    //when friends$ update, update activeNows of conversations
    this.friendsService.friends$.subscribe(friends => {
     
      if(this.conversationsLoadingInProgress$.value || this.friendsService.friendsLoadingInProgress$.value)
        return;

      const _conversations = this.conversations$.value as Array<Conversation>;
      _conversations.forEach(conversation => this.getActiveAvailable(conversation));
      this.conversations$.next(this.conversations$.value);
    });


  }

  //get conversation type, group or private
  public static getConversationType(_conversation: string | Conversation): ConversationType {

    if(typeof _conversation !== 'string')
      return _conversation.type;

    let conversationId = _conversation;

    if (ConversationsService._conversations.findIndex(conversation => conversation.id === conversationId) >= 0)
      return 'group';
    else if (ConversationsService._conversations.findIndex(conversation => conversation.users[0].id === conversationId && conversation.users.length === 1))
      return 'private';

    return 'unknown';
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
          ...[], //start with empty message list
          ...(this.friendsService.friendsLoadingInProgress$.value? //if friends are loaded get activeNows, else set default
                {activeAvailable: false, lastActive: 0} :  
                this.getActiveAvailable(conversation)),
          users: conversation.users.map(_user => {return({
            id: _user.id,
            username: _user.username,
            isTyping: false,
            isTyping$: new Subject<boolean>()
          })})
        })}));

        //subscribe to users' isTyping$ s
        (this.conversations$.value as Array<Conversation>).forEach(conversation => this.typingSubscribe(conversation));

        this.conversationsLoadingInProgress$.next(false);
        this.allowPlaceholder$.next(!response.conversations || response.conversations.length === 0);

        this.setLandingConversation();
        
        //pooling for silent friends list update
        interval(5000).subscribe(() => this.updateConversationsSilent());
      }
    });

    //when friends and conversations are loaded get last active of conversations
    this.friendsService.friendsLoadingInProgress$.subscribe(value => {
      if(!value && this.conversations$.value.length > 3)
        this.conversations$.next((this.conversations$.value as Array<Conversation>).forEach(conversation => this.getActiveAvailable(conversation)));
    })

  }

  //on landing set active conversation and chat
  public setLandingConversation() {

    //check for conversation id in url
    const conversationUrlId = this.router.url.split('@').at(-1);
    const conversations = this.conversations$.value as Array<Conversation>;
    let conversation;
    
    //try to find group, then private conversation
    if(conversationUrlId && conversationUrlId.length > 0){

      conversation = conversations.find(_conversation => _conversation.id === conversationUrlId);

      if(!conversation)
        conversation = conversations.find(_conversation => _conversation.users[0].id === conversationUrlId && _conversation.type === 'private');


      //if found, set as active
      if(conversation){
        this.setActiveConversation(conversation, true);
        return;
      }

      //when not found set first of array
      this.setActiveConversation(conversations[0], true);
      return;
    }

    //try to get ID from local storage
    if(window.localStorage && isPlatformBrowser(this.platformId)){

      const conversationLocalStorageID = window.localStorage.getItem('lastActiveConversation');

      if(conversationLocalStorageID && conversationLocalStorageID.length > 1){

        //try to find group, then private first
        conversation = conversations.find(_conversation => _conversation.id === conversationLocalStorageID);

        if(!conversation)
          conversation = conversations.find(_conversation => _conversation.users[0].id === conversationLocalStorageID);

        //if found select and navigate
        if(conversation){
          this.router.navigate(['conversations', '@' + conversation.type === 'private'? conversation.users[0].id : conversation.id]);
          this.setActiveConversation(conversation, true);
        }

        //else set first as active
        else {
          this.setActiveConversation(conversations[0], true);
        }
      }
      else{
        this.setActiveConversation(conversations[0], true);
      }
    }
    else {
      this.setActiveConversation(conversations[0], true);
    }
  }

  //get messages of conversation by Id
  public getConversationMessages(conversation: Conversation, conversationSwitch: boolean = false) {

    const conversationIndex = conversation.type === 'private'? (this.conversations$.value as Array<Conversation>).findIndex(__conversation => __conversation.users[0].id === conversation.users[0].id && __conversation.users.length === 1) : (this.conversations$.value as Array<Conversation>).findIndex(__conversation => __conversation.id === conversation.id);
    const _conversation = this.conversations$.value[conversationIndex];
    const subjectId = conversation.type === 'private'? conversation.users[0].id : conversation.id;

    if(_conversation){
      this.httpClient.get<{state: string, message: string, messages: Array<MessageInterface>}>('api/express/conversations/getConversationMessages', {withCredentials: true, params: new HttpParams().set('conversationId', subjectId)}).subscribe(response => {
        if(response.state === 'success'){

          //assign messages to conversation
          _conversation.messages = [...response.messages];

          //emit messages values
          const _conversations = [...this.conversations$.value];
          _conversations.splice(conversationIndex, 1, _conversation);

          this.conversations$.next(_conversations);
          this.activeConversation$.next(_conversation);

          //scroll chat to bottom on current conversation switch
          if(conversationSwitch)
            this.scrollChatToBottom$.next(true);
        }
      });
    }
  }

  //set friend or group typing
  public static setTyping(typingInfo: TypingInfo, _conversationsService: ConversationsService) {

    //find conversation by id
    const _conversations = [..._conversationsService.conversations$.value];

    const conversationIndex = (_conversations as Array<Conversation>).findIndex(conversation => conversation.id === typingInfo.conversationId);

    if(conversationIndex >= 0){
      const conversation = _conversations[conversationIndex] as Conversation;

      //update users typing
      const conversationUser = conversation.users.find(user => user.id === typingInfo.senderId);

      if(conversationUser){

        conversationUser.isTyping$.next(typingInfo.typing);
        conversationUser.isTyping = typingInfo.typing;

        //update
        _conversations.splice(conversationIndex, 1, conversation);
        _conversationsService.conversations$.next(_conversations);
      }
    }
  }

  //proxying when setting active conversation
  public setActiveConversation(conversation: Conversation, conversationSwitch: boolean = false) {

    //get active conversations message and update
    this.getConversationMessages(conversation, conversationSwitch);
  }

  //try to find conversation, or create new one
  public openConversation({usersIds, conversationType}: {usersIds: Array<string>, conversationType: ConversationType}) {
    
    //update conversations and look for requested (if type is private)
    if(conversationType === 'private' && usersIds.length === 1){

      //refresh conversations
      this.updateConversationsSilent().subscribe(updateStatus => {
        if(updateStatus){

          const _conversation = (this.conversations$.value as Array<Conversation>).find(conversation => conversation.users[0].id === usersIds[0]);
          
          //if conversation is found switch to it
          if(_conversation){
            this.router.navigate(['conversations', '@' + usersIds[0]]);
            this.setActiveConversation(_conversation, true);
            return;
          }

          //else open new conversation
          else {

            //request
            this.httpClient.put<{state: string, message: string, conversationId?: string}>('api/express/conversations/openConversation', {subjectId: usersIds[0]}, {withCredentials: true}).subscribe(response => {
              
              //if got conversationId, recall function and switch to
              if(response.conversationId)
                this.openConversation({usersIds: usersIds, conversationType: 'private'});
            })
          }
        }
      })
    }
  }

  //pooling conversations
  private updateConversationsSilent(): Observable<boolean> {

    //request
    const response$ = this.httpClient.get<{state: string, message: string, conversations: Array<ConversationResponse>}>('api/express/conversations/getConversations', {
      withCredentials: true, 
    }).pipe(map(response => {
      if(response.state === 'success'){

        this.conversations$.next(response.conversations.map(conversation => {

          //get conversation twin from previously saved conversations
          const conversationTwin = (this.conversations$.value as Array<Conversation>).find(_conversation => _conversation.id === conversation.id);
          
          //unsubscribe from previous isTyping$s
          if(conversationTwin)
            this.typingUnsubscribe(conversationTwin);
          
          //return new conversation (updated by pooling)
          return({
            ...conversation,
            ...[], //start with empty message list
            ...(this.friendsService.friendsLoadingInProgress$.value? //if friends are loaded get activeNows, else set default
                {activeAvailable: false, lastActive: 0} :  
                this.getActiveAvailable(conversation)),
            users: conversation.users.map(_user => {return({
              id: _user.id,
              username: _user.username,
              isTyping: conversationTwin? conversationTwin.users.find(__user => __user.id === _user.id)?.isTyping : false,
              isTyping$: new Subject<boolean>()
            })})
          })
        }));

        //subscribe to users' isTyping$ s
        (this.conversations$.value as Array<Conversation>).forEach(conversation => this.typingSubscribe(conversation));

        //set all conversations isTyping accordingly
        (this.conversations$.value as Array<Conversation>).forEach(conversation => {
          conversation.users.forEach(user => {
            if(user.isTyping)
              ChatService.setTyping({conversationId: conversation.id, senderId: user.id, typing: true})
          })
        })

        this.conversationsLoadingInProgress$.next(false);
        this.allowPlaceholder$.next(!response.conversations || response.conversations.length === 0);

        return true;
      }

      return false;
    }), take(1));

    response$.subscribe();
    return response$
  
  }

  //subscribe to each user isTyping$
  private typingSubscribe(conversation: Conversation) {


    //subscribe
    conversation.users.forEach(user => {
      user.isTyping$.pipe(
        switchMap(() => 
          merge(
            [true],
            timer(1500).pipe(map(() => false))
          )
        ),
        takeUntil(user.isTyping$.pipe(last(undefined, true)))
      ).subscribe(isTyping => {
        if(!isTyping)
          ConversationsService.setTyping({conversationId: conversation.id, senderId: user.id, typing: false}, this);
      })
    })
  }

  //unsubscribe (or try to do so) to each conversation's user
  private typingUnsubscribe(conversation: Conversation) {
    conversation.users.forEach((user) => {
      user.isTyping$.complete();
    })
  }
}

export type ConversationType = 'private' | 'group' | 'unknown';

interface ConversationResponse {
  id: string,
  users: Array<{id: string, username: string}>
  locked: boolean,
  lastMessage: {
    senderId: string,
    content: string,
    timestamp: Date,
    emojis: Array<string>,
    type?: MessageType
  }
  type: ConversationType,
  name: string
}

export interface Conversation extends Omit<ConversationResponse, 'users'> {
  messages: Array<MessageInterface>,
  users: Array<User>
  activeAvailable: boolean
  lastActive: Date,
}

export interface User {
  id: string,
  username: string,
  isTyping: boolean,
  isTyping$: Subject<boolean>
}
