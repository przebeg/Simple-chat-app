import { Component } from '@angular/core';

@Component({
  selector: 'friend-conversation-loading-placeholder',
  imports: [],
  template: `
    <div id="profile-image-placeholder" class="global-loading"></div>
    <div id="labels">
      <div id="big-label" class="global-loading"></div>
      <div id="small-label" class="global-loading"></div>
    </div>
  `,
  styles: `
    :host {
      display: block;
      width: 100%;
      height: 80px;
      border-radius: 4px;
      box-sizing: border-box;
      padding: 16px;
      display: flex;
      align-items: center;
      justify-content: flex-start;
      margin-top: 16px;
    }
    #profile-image-placeholder{
      height: 100%;
      width: auto;
      aspect-ratio: 1;
      background-size: cover;
      background-position: center center;
      border-radius: 50%;
    }
    #labels{
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      padding-left: 24px;
      gap: 10px
    }
    #labels .placeholder-bg{
      border-radius: 5px;
    }
    #big-label{
      width: 240px;
      height: 27px
    }
    #small-label{
      width: 118px;
      height: 18px
    }

  `
})
export class FriendConversationLoadingPlaceholderComponent {

}
