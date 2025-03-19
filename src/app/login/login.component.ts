import { Component } from '@angular/core';
import {FormControl, FormsModule, ReactiveFormsModule} from '@angular/forms'
import { signInRoutes } from './login-component-routing.component';
import { NavigationEnd, RouterOutlet } from '@angular/router';
import { LoginService } from './services/login.service';
import { Router } from '@angular/router';
import { filter } from 'rxjs/operators';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { response } from 'express';
import { BehaviorSubject, Subject } from 'rxjs';
import { Field, RegisterFormResponse, RegisterFormService } from './register/classes';
import { FirstValueFromConfig } from 'rxjs/internal/firstValueFrom';

@Component({
  selector: 'login',
  imports: [RouterOutlet, ReactiveFormsModule, HttpClientModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})

export class LoginComponent {
  
  constructor(private loginService: LoginService, private router: Router, private httpClient: HttpClient){


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
    
    this.registerFormService = this.loginService.registerFormService;
    this.registerFormResponse = this.loginService.registerFormResponse;
  }

  //switch header name
  headerName: string = "";

  //switch to class register
  isRegister: boolean = false;

  //register form object
  registerFormService: BehaviorSubject<RegisterFormService>;
  registerFormResponse: Subject<RegisterFormResponse>;

  //input forms array
  registerFields: Array<Field> | null = null;

  //switch button to loading class
  buttonLoading: boolean = false;

  //on submit button click
  submitButtonClick(){
    if(this.buttonLoading)
      return;

    if(this.isRegister){

      
      //get fields and check valid
      const fields = new Array<Field | undefined>(
        this.loginService.registerFormService.value.username?.getField(),
        this.loginService.registerFormService.value.password?.getField(),
        this.loginService.registerFormService.value.email?.getField()
      );

      //if any of fields is not valid return
      if(fields.findIndex(field => !field?.valid) >= 0)
        return;

      //send response waiting
      this.loginService.registerFormResponse.next({
        state: 'waiting',
        fields: null
      })

      //set button loading
      this.buttonLoading = true;


      //create user data to be send to sever
      const newUserData = {
        image: this.registerFormService.value.profileImage?.image.value?? 'null',
        username: this.registerFormService.value.username?.formControl.value,
        password: this.registerFormService.value.password?.formControl.value,
        email: this.registerFormService.value.email?.formControl.value
      }

      this.httpClient.post('/api/express/login/registerNewUser', {'userData': newUserData}).subscribe((response) => {
        console.log(response);
      })
    }
      
  }
}
