import { Component, Input } from '@angular/core';
import { Friend, FriendsPanelComponent } from '../friends-panel.component';
import { BehaviorSubject, Observable, Subject } from 'rxjs';

@Component({
  selector: 'friend',
  imports: [],
  templateUrl: './friend.component.html',
  styleUrl: './friend.component.css'
})
export class FriendComponent {
    
  @Input() friendData!: Friend;

  lastActiveString: string = '';
  activeNow: boolean = false;

  constructor() {}

  ngOnChanges(){
    this.updateLastActive();
  }

  //set last activa small text
  updateLastActive() {

    const timeDiff = Date.now() - new Date(this.friendData.lastActive).getTime();
    this.activeNow = false;

    //if last active < 1m
    if(timeDiff / 1000 < 60){
      this.lastActiveString = 'Active Now';
      this.activeNow = true;
    }

    //last active >1m && <1h
    else if(timeDiff / (1000 * 60) < 60)
      this.lastActiveString = `Last active ${Math.floor(timeDiff / (1000 * 60))} min ago`;

    //last active <1d && >1h
    else if(timeDiff / (1000 * 60 * 60) < 24)
      this.lastActiveString = `Last active ${Math.floor(timeDiff / (1000 * 60 * 60))}h ago`;

    //last active >1d
    else if(timeDiff / (1000 * 60 * 24) >= 24)
      this.lastActiveString = `Last active ${Math.floor(timeDiff / (1000 * 60 * 60 * 24))}d ago`;

  }
}
