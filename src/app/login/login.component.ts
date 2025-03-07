import { Component } from '@angular/core';
import {FormControl, FormsModule, ReactiveFormsModule} from '@angular/forms'
import { signInRoutes } from './login-component-routing.component';
import { NavigationEnd, RouterOutlet } from '@angular/router';
import { FormService } from '../shared/form.service';
import { Router } from '@angular/router';
import { filter } from 'rxjs/operators';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { response } from 'express';

@Component({
  selector: 'login',
  imports: [RouterOutlet, ReactiveFormsModule, HttpClientModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})

export class LoginComponent {
  
  constructor(private formService: FormService, private router: Router, private httpClient: HttpClient){
    
    //get child router form content via service
    formService.loginForm.subscribe((value) => console.log(value));

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
    })
    
  }

  //switch header name
  headerName: string = "";

  //switch to class register
  isRegister: boolean = false;


  //on submit button click
  submitButtonClick(){
    if(this.isRegister){
      const newUserData = {
        image: 'null',
        username: 'nazwa',
        password: 'haslo',
        email: 'imejl@wp.pl'
      }
      console.log('x')
      this.httpClient.post('/api/express/login/registerNewUser', {'userData': newUserData}).subscribe((response) => {
        null
      })
    }
      
  }
}
