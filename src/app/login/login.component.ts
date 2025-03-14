import { Component } from '@angular/core';
import {FormControl, FormsModule, ReactiveFormsModule} from '@angular/forms'
import { signInRoutes } from './login-component-routing.component';
import { NavigationEnd, RouterOutlet } from '@angular/router';
import { FormService } from '../shared/form.service';
import { Router } from '@angular/router';
import { filter } from 'rxjs/operators';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { response } from 'express';
import { BehaviorSubject, Subject } from 'rxjs';
import { RegisterFormResponse, RegisterFormService } from './register/classes';

@Component({
  selector: 'login',
  imports: [RouterOutlet, ReactiveFormsModule, HttpClientModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})

export class LoginComponent {
  
  constructor(private formService: FormService, private router: Router, private httpClient: HttpClient){


     //get router end-point
     this.router.events.pipe(filter(event => event instanceof NavigationEnd)).subscribe((event) => {
      console.log(event.url)
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
    
    this.registerFormService = this.formService.registerFormService;
    this.registerFormResponse = this.formService.registerFormResponse;
  }

  //switch header name
  headerName: string = "";

  //switch to class register
  isRegister: boolean = false;

  //register form object
  registerFormService: BehaviorSubject<RegisterFormService | null>;
  registerFormResponse: Subject<RegisterFormResponse | null>;



  //on submit button click
  submitButtonClick(){
    if(this.isRegister){

      //check if registerFormService is empty (null)
      if(this.registerFormService.value === null){
        this.registerFormResponse.next({
          state: 'fail',
          fields: null
        });
        return;
      }

      //chreate user data to be send to sever
      const newUserData = {
        image: this.registerFormService.value.profileImage,
        username: this.registerFormService.value.username,
        password: this.registerFormService.value.password,
        email: this.registerFormService.value.email
      }
      console.log(newUserData);
      this.httpClient.post('/api/express/login/registerNewUser', {'userData': newUserData}).subscribe((response) => {
        null
      })
    }
      
  }
}
