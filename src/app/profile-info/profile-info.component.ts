import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'profile-info-component',
  imports: [],
  templateUrl: './profile-info.component.html',
  styleUrl: './profile-info.component.css'
})
export class ProfileInfoComponent {

  
  constructor(private httpClient: HttpClient){
    //httpClient.get('api/express/user/friends/getFriendsList', {withCredentials: true}).subscribe(response => console.log(response));
  }


}
