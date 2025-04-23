import { Component, signal, Signal, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ProfileInfoComponent } from '../profile-info/profile-info.component';
import { RouterOutlet, Router, NavigationEnd, RouterLink } from '@angular/router';
import {BehaviorSubject, filter} from 'rxjs'
import { ChatPanelComponent } from './chat-panel/chat-panel.component';
import { ChatService } from './chat.service';

@Component({
  selector: 'main-page-component',
  imports: [ProfileInfoComponent, RouterOutlet, RouterLink, ChatPanelComponent],
  templateUrl: './main-page.component.html',
  styleUrl: './main-page-component.css'
})
export class MainPageComponent {

  leftPanelTitle: string = '';
  chatsIndicatorValue: BehaviorSubject<number>
  friendsIndicatorValue: BehaviorSubject<number>

  constructor(private router: Router, private chatService: ChatService) {

    //assing dynamic values from chatService
    this.chatsIndicatorValue = this.chatService.newChatsCount;
    this.friendsIndicatorValue = this.chatService.newFriendRequestsCount;

    console.log(this.chatsIndicatorValue.value)

    //on router navigation get and set left panel title
    this.router.events.pipe(filter(event => event instanceof NavigationEnd)).subscribe(event => {
      this.leftPanelTitle = event.urlAfterRedirects.split('/')[1];
      this.leftPanelTitle = this.leftPanelTitle.replace(this.leftPanelTitle[0], this.leftPanelTitle[0].toUpperCase())
    });



    //get friends requests number

  };




  
}
