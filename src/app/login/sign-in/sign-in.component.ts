import { afterNextRender, Component, Injectable, Inject } from '@angular/core';
import {FormControl, FormGroup, FormsModule, ReactiveFormsModule, ValueChangeEvent} from '@angular/forms'
import { BehaviorSubject, combineLatest } from 'rxjs';
import { LoginService } from '../services/login.service';
import { RouterLink } from '@angular/router';
import { filter } from 'rxjs';
import { SignInFormControl } from '../services/login.service';
import { SignInLoginService } from '../services/login.service';
import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';

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

  signInForm: FormGroup;
  usernameEmailFormControl: SignInFormControl;
  passwordFormControl: SignInFormControl;
  
  constructor (private signInService: SignInLoginService, @Inject(PLATFORM_ID) private platformId: Object) {
    this.signInForm = this.signInService.signInForm;

    this.usernameEmailFormControl = this.signInForm.get('usernameEmail') as SignInFormControl;
    this.passwordFormControl = this.signInForm.get('password') as SignInFormControl;

    //get saved session storage usernameEmail
    if(isPlatformBrowser(platformId) && window){
      this.usernameEmailFormControl.setValue(window.sessionStorage.getItem('savedLoginUsernameEmail')?? ''); 

      //validate
      SignInFormControl.inputBlur(this.usernameEmailFormControl);
    }

    //on usernameEmail change save to sessionStroage
    this.usernameEmailFormControl.valueChanges.subscribe((value) => {
      if(isPlatformBrowser(platformId) && window)
        window.sessionStorage.setItem('savedLoginUsernameEmail', value);
    })
  }

  //on input blur event
  inputBlur(formControl: SignInFormControl) {
    SignInFormControl.inputBlur(formControl);
  }



  
  
}
