import { Component, Input } from '@angular/core';
import { Friend } from '../friends-panel.component';

@Component({
  selector: 'friend',
  imports: [],
  templateUrl: './friend.component.html',
  styleUrl: './friend.component.css'
})
export class FriendComponent {
    
  @Input() friendData: Friend = {id: '', active: false, username: '', lastActive: new Date};

  //lastActiveString: string = Date.now() - this.friendData.lastActive.getTime();

  constructor(){
    console.log(Date.now())
  }

}
