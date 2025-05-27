import { HttpClient } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { BehaviorSubject, Subject, debounceTime, interval, filter, take, pipe, switchAll, pairwise, Subscription} from 'rxjs';
import { Friend, FriendsService } from '../friends-panel/friends.service';
import { SsrCookieService } from 'ngx-cookie-service-ssr';
import { NavigationEnd, NavigationStart, Router } from '@angular/router';
import { HttpParams } from '@angular/common/http';
import { ChatService, MessageInterface, TypingInfo } from '../chat-panel/chat.service';
import { ConversationHTMLData } from './conversations-panel.component';
import { PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class ConversationsService {

  conversationsLoadingInProgress$: BehaviorSubject<boolean> = new BehaviorSubject(true);
  conversations$: BehaviorSubject<Array<Conversation> | any> = new BehaviorSubject([]);
  allowPlaceholder$: BehaviorSubject<boolean> = new BehaviorSubject(false);
  activeConversation$: Subject<Conversation> = new Subject();

  private conversationTypings$: Array<Subject<boolean>> = []

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

    //on conversations$ update
    this.conversations$.pipe(pairwise()).subscribe(([prevConversations, nextConversations]) => {

      //update static _conversation$
      ConversationsService._conversations = [...nextConversations];

      //unsubscribe previous isTyping$
      (prevConversations as Array<Conversation>).forEach(prevConversation => {
        if(prevConversation.isTyping$ && prevConversation.isTyping$ instanceof Subscription)
          prevConversation.isTyping$.unsubscribe();
      });

      //subscribe to next values of isTyping$
      (nextConversations as Array<Conversation>).forEach(nextConversation => {
        nextConversation.isTyping$.pipe(
          filter(value => value === true),
          debounceTime(2000)
        ).subscribe((value) => {
          console.log(value)
        })
      })
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
          isTyping: false,
          isTyping$: new Subject<boolean>()
        })}))

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
        this.setActiveConversation(conversation);
        return;
      }

      //when not found set first of array
      this.setActiveConversation(conversations[0]);
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
          this.setActiveConversation(conversation);
        }

        //else set first as active
        else {
          this.setActiveConversation(conversations[0]);
        }
      }
      else{
        this.setActiveConversation(conversations[0]);
      }
    }
    else {
      this.setActiveConversation(conversations[0]);
    }
  }

  //get messages of conversation by Id
  public getConversationMessages(conversation: Conversation) {

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
        }
      });
    }
  }

  //set friend or group typing
  public static setTyping(typingInfo: TypingInfo, _conversationsService: ConversationsService) {

    const _conversations = [..._conversationsService.conversations$.value];

    //find type, group or private
    const conversationType = ConversationsService.getConversationType(typingInfo.subjectId);
    switch(conversationType) {
      case 'private':
        const conversationIndex = _conversations.findIndex(conversation => conversation.users[0].id === typingInfo.subjectId && conversation.users.length === 1);
        if(conversationIndex >= 0){
          let conversation = {..._conversations[conversationIndex]};
          conversation.isTyping$.next(typingInfo.typing);
          conversation.isTyping = typingInfo.typing;

          //update
          _conversations.splice(conversationIndex, 1, conversation);
          _conversationsService.conversations$.next(_conversations);
        }
      break;
    }
  }

  //proxying when setting active conversation
  public setActiveConversation(conversation: Conversation) {

    //get active conversations message and update
    this.getConversationMessages(conversation);
  }

  //pooling conversations
  private updateConversationsSilent() {

    //request
    const response$ = this.httpClient.get<{state: string, message: string, conversations: Array<ConversationResponse>}>('api/express/conversations/getConversations', {
      withCredentials: true, 
    });
    
    response$.subscribe(response => {
      if(response.state === 'success'){
        this.conversations$.next(response.conversations.map(conversation => {

          //get conversation twin from previously saved conversations
          const conversationTwin = (this.conversations$.value as Array<Conversation>).find(_conversation => _conversation.id === conversation.id)
          
          //if twin is typing, emit isTyping$ true
          if(conversationTwin?.isTyping)
            conversationTwin.isTyping$.next(true);

          //return new conversation (updated by pooling)
          return({
            ...conversation,
            ...[], //start with empty message list
            ...(this.friendsService.friendsLoadingInProgress$.value? //if friends are loaded get activeNows, else set default
                {activeAvailable: false, lastActive: 0} :  
                this.getActiveAvailable(conversation)),
            isTyping: conversationTwin? conversationTwin.isTyping : false,
            isTyping$: new Subject<boolean>()
          })
        }));

        this.conversationsLoadingInProgress$.next(false);
        this.allowPlaceholder$.next(!response.conversations || response.conversations.length === 0);
      }
    });
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
    emojis: Array<string>
  }
  type: ConversationType,
  name: string
}

export interface Conversation extends ConversationResponse {
  messages: Array<MessageInterface>,
  activeAvailable: boolean
  lastActive: Date,
  isTyping: boolean,
  isTyping$: Subject<boolean>
}
