import { afterNextRender, Component, Injectable } from '@angular/core';
import {FormControl, FormsModule, ReactiveFormsModule, ValueChangeEvent} from '@angular/forms'
import { BehaviorSubject, combineLatest } from 'rxjs';
import { LoginService } from '../services/login.service';
import { RouterLink } from '@angular/router';
import { filter } from 'rxjs';

@Component({
  selector: 'sign-in-component',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './sign-in.component.html',
  styleUrl: './sign-in.component.css'
})

@Injectable({
  providedIn: 'root'
})

export class SignInComponent {

  savedUsername = '';
  savedRememberMe = 'false';

  username: FormControl = new FormControl<string>('');
  password: FormControl = new FormControl<string>('');
  rememberMe: FormControl = new FormControl<boolean>(false);
  
  constructor(public formService: LoginService){

    afterNextRender(() => {

      //get saved values and apply to inputs
      this.savedUsername = window.localStorage.getItem('savedUserName') as string;
      if(!this.savedUsername)
        this.savedUsername = '';
  
      this.savedRememberMe = window.localStorage.getItem('savedRememberMe') as string;
      if(!this.savedRememberMe)
        this.savedRememberMe = 'false';
  
      this.username.setValue(this.savedUsername);
      this.rememberMe.setValue((this.savedRememberMe === 'true'? true : false));
    })

    //on rememberMe checkbox changed to false, save or delete localstorage items
    this.rememberMe.events.pipe(filter(e => e instanceof ValueChangeEvent)).subscribe(e => {
      window.localStorage.setItem('savedRememberMe', e.value);
    })

    //on form values change provide do formService
    // combineLatest([this.username.valueChanges, this.password.valueChanges]).subscribe(([username, password]) => {
    //   //this.formService.loginFormChange({username: username, password: password});
    // })
   
  }
  
}
