import { Component, signal, Signal, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ProfileInfoComponent } from '../profile-info/profile-info.component';
import { RouterOutlet, Router, NavigationEnd, RouterLink } from '@angular/router';
import {BehaviorSubject, filter, interval, Observable, Subject} from 'rxjs'
import { ChatPanelComponent } from './chat-panel/chat-panel.component';
import { FriendsService } from './friends-panel/friends.service';
import {SsrCookieService} from 'ngx-cookie-service-ssr'

@Component({
  selector: 'main-page-component',
  imports: [ProfileInfoComponent, RouterOutlet, RouterLink, ChatPanelComponent],
  templateUrl: './main-page.component.html',
  styleUrl: './main-page-component.css'
})
export class MainPageComponent {

  leftPanelTitle: string = '';
  friendsRequestsIndicatorValue: number = 0;

  constructor(private router: Router, private friendsService: FriendsService, private SsrCookieService: SsrCookieService) {

    //on new friend request
    this.friendsService.friendRequests$.subscribe(friendRequests => {
      this.friendsRequestsIndicatorValue = friendRequests.length
    });

    //on router navigation get and set left panel title
    this.router.events.pipe(filter(event => event instanceof NavigationEnd)).subscribe(event => {
      this.leftPanelTitle = event.urlAfterRedirects.split('/')[1];
      this.leftPanelTitle = this.leftPanelTitle.replace(this.leftPanelTitle[0], this.leftPanelTitle[0].toUpperCase())
    });

  };




  
}
