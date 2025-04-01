import { Component, Input, Output } from '@angular/core';
import {FormControl, FormGroup, FormsModule, ReactiveFormsModule} from '@angular/forms'
import { signInRoutes } from './login-component-routing.component';
import { NavigationEnd, RouterOutlet } from '@angular/router';
import { LoginService, RegisterFormControl, RegisterImageInput } from './services/login.service';
import { Router } from '@angular/router';
import { filter } from 'rxjs/operators';
import { HttpClient, HttpClientModule, HttpHeaders } from '@angular/common/http';
import { response } from 'express';
import { BehaviorSubject, Subject } from 'rxjs';
import { Field, RegisterFormResponse, RegisterFormService } from './register/classes';
import { FirstValueFromConfig } from 'rxjs/internal/firstValueFrom';
import { EventEmitter } from 'stream';

@Component({
  selector: 'login',
  imports: [RouterOutlet, ReactiveFormsModule, HttpClientModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})

export class LoginComponent {

  headerName: string = "";
  isRegister: boolean = false;
  buttonLoading: boolean = false;

  private submitButtonTap = new Subject<any>();
  
  constructor(private loginService: LoginService, private router: Router, private httpClient: HttpClient){

    //on submit button tap check for register inputs emptyness
    

     //get router end-point
     this.router.events.pipe(filter(event => event instanceof NavigationEnd)).subscribe((event) => {
      switch(event.url.split('/').at(-1)){
        case 'sign-in': 
          this.headerName = 'Sign in';
          this.isRegister = false; 
          break;
        case 'register': 
          this.headerName = "Register";
          this.isRegister = true; 
          break;
        default: 
          this.headerName = 'Log in';
          this.isRegister = false; 
        break;
      }
    });
  
  }


  //on submit button click
  submitButtonClick(){
    
    if(this.buttonLoading)
      return;

    //get register form, check valid and perform reqister API request
    if(this.isRegister){

      //emit click event to check for inputs emptyness
      this.loginService.submitButtonClick.next(null);

      if(this.loginService.registerForm.valid){

        //set button loading
        this.buttonLoading = true;

        //disable formGroup
        this.loginService.registerForm.disable();

        //create user data to be send to sever
        const profileImage: RegisterImageInput = (this.loginService.registerForm.get('profileImage') as RegisterImageInput);
        const userData: FormData = new FormData();
        userData.append('profileImage', new File([profileImage.imageFile], ['profileImage', profileImage.imageExtension].join('.')));
        userData.append('userData', JSON.stringify({
          'username': this.loginService.registerForm.get('username')?.value,
          'password': this.loginService.registerForm.get('password')?.value,
          'email': this.loginService.registerForm.get('email')?.value,
        }));

        this.httpClient.post('/api/express/accounts/registerNewUser', userData).subscribe((response) => {
          console.log(response);
        })
      }
    }
  }
}
