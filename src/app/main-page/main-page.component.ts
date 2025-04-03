import { Component, signal, Signal, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ProfileInfoComponent } from '../profile-info/profile-info.component';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'main-page-component',
  imports: [ProfileInfoComponent, RouterOutlet],
  templateUrl: './main-page.component.html',
  styleUrl: './main-page-component.css'
})
export class MainPageComponent {

  constructor(@Inject(PLATFORM_ID) private platformId: Object){

    
  }


  
}
