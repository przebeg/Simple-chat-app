import { Component, signal, Signal, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ProfileInfoComponent } from '../profile-info/profile-info.component';
import { RouterOutlet, Router, NavigationEnd, RouterLink } from '@angular/router';
import {filter} from 'rxjs'

@Component({
  selector: 'main-page-component',
  imports: [ProfileInfoComponent, RouterOutlet, RouterLink],
  templateUrl: './main-page.component.html',
  styleUrl: './main-page-component.css'
})
export class MainPageComponent {

  leftPanelTitle: string = 'Search';

  constructor(private router: Router) {

    //on router navigation get and set left panel title
    this.router.events.pipe(filter(event => event instanceof NavigationEnd)).subscribe(event => {
      this.leftPanelTitle = event.urlAfterRedirects.split('/')[1];
      this.leftPanelTitle = this.leftPanelTitle.replace(this.leftPanelTitle[0], this.leftPanelTitle[0].toUpperCase())
    });
  };




  
}
