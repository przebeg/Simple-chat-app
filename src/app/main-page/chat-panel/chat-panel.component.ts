import { Component } from '@angular/core';
import { ChatServiceService } from '../chat-service.service';

@Component({
  selector: 'chat-panel',
  imports: [],
  templateUrl: './chat-panel.component.html',
  styleUrl: './chat-panel.component.css'
})

export class ChatPanelComponent {

  constructor (private chatService: ChatServiceService) {
    
  }
}


