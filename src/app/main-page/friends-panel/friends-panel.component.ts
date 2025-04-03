import { Component } from '@angular/core';
import { FriendComponent } from './friend/friend.component';
import { FriendConversationLoadingPlaceholderComponent } from '../friend-conversation-loading-placeholder/friend-conversation-loading-placeholder.component';

@Component({
  selector: 'friends-panel',
  imports: [FriendComponent, FriendConversationLoadingPlaceholderComponent],
  templateUrl: './friends-panel.component.html',
  styleUrl: './friends-panel.component.css'
})
export class FriendsPanelComponent {
  
}
