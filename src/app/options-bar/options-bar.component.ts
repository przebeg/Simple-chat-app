import { Component, signal, Signal, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ProfileInfoComponent } from '../profile-info/profile-info.component';

@Component({
  selector: 'options-bar-component',
  imports: [ProfileInfoComponent],
  templateUrl: './options-bar.component.html',
  styleUrl: './options-bar.component.css'
})
export class OptionsBarComponent {

  constructor(@Inject(PLATFORM_ID) private platformId: Object){

    //check if platform is NOT browser
    if(!isPlatformBrowser(this.platformId)){
        this.lightMode = "bright";
        return;
    }

    //get saved light mode
    this.lightMode = window.localStorage.getItem('lightMode') as string;
    if(!this.lightMode || (this.lightMode !== 'bright' && this.lightMode !== 'dark')){
      
      //if not detected, use system's theme
      //try dark theme first
      if(window.matchMedia('(prefers-color-scheme: dark)').matches)
        this.lightMode = 'dark';
      else this.lightMode = 'bright';

      //save
      window.localStorage.setItem('lightMode', this.lightMode);
    }
  }

  lightMode: string = "bright";
  lightModeTransitEnabled: boolean = false;

  lightSwitchClick() {
    if(typeof this.lightMode == undefined)
      this.lightMode = "dark"

    //enable transition
    this.lightModeTransitEnabled = true;

    //switch light mode
    if(this.lightMode === "bright")
      this.lightMode = "dark"
    else this.lightMode = "bright";

    //save
    window.localStorage.setItem('lightMode', this.lightMode);
  }

  
}
