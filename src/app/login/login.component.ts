import { Component, Input, Output } from '@angular/core';
import {FormControl, FormGroup, FormsModule, ReactiveFormsModule} from '@angular/forms'
import { signInRoutes } from './login-component-routing.component';
import { NavigationEnd, RouterOutlet } from '@angular/router';
import { RegisterService, RegisterFormControl, RegisterImageInput, SignInFormControl } from './services/login.service';
import { Router } from '@angular/router';
import { filter } from 'rxjs/operators';
import { HttpClient, HttpClientModule, HttpHeaders, HttpParams } from '@angular/common/http';
import { response } from 'express';
import { BehaviorSubject, Subject } from 'rxjs';
import { Field, RegisterFormResponse, RegisterFormService } from './register/classes';
import { FirstValueFromConfig } from 'rxjs/internal/firstValueFrom';
import { EventEmitter } from 'stream';
import { SignInLoginService } from './services/login.service';
import { RegisterComponent } from './register/register.component';

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
  
  constructor(private registerService: RegisterService, private signInLoginService: SignInLoginService, private router: Router, private httpClient: HttpClient){

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
      this.registerService.submitButtonClick.next();

      if(this.registerService.registerForm.valid){

        //set button loading
        this.buttonLoading = true;

        //disable formGroup
        this.registerService.registerForm.disable();

        //create user data to be send to sever
        const profileImage: RegisterImageInput = (this.registerService.registerForm.get('profileImage') as RegisterImageInput);
        const userData: FormData = new FormData();

        if(profileImage.imageFile.size > 0)
          userData.append('profileImage', new File([profileImage.imageFile], ['profileImage', profileImage.imageExtension].join('.')));
        
        userData.append('userData', JSON.stringify({
          'username': this.registerService.registerForm.get('username')?.value,
          'password': this.registerService.registerForm.get('password')?.value,
          'email': this.registerService.registerForm.get('email')?.value,
        }));

        this.httpClient.post<{state: string, message: string}>('/api/express/accounts/registerNewUser', userData).subscribe((response) => {
          if(response.state === 'success'){
            //this.RegisterComponent.clearSessionStorage();
            this.router.navigate(['/'])
          }
        })
      }
    }

    //for login
    else {
      if(this.buttonLoading)
        return;
      
      //only error should now come from Validator.required, so check for input empty
      this.signInLoginService.submitButtonClick.next();
      
      const signInForm: FormGroup = this.signInLoginService.signInForm;
      
      if(signInForm.valid){
        this.buttonLoading = true;

        const params = new HttpParams()
          .set('credentials', JSON.stringify({usernameEmail: signInForm.get('usernameEmail')?.value, password: signInForm.get('password')?.value}));
        
        //make request
        this.httpClient.get<{state: string, message: string}>('api/express/accounts/sign-in', {params}).subscribe((response) => {
          if(response.state === 'success'){
            this.router.navigate(['/']);
            return;
          }
          else{
            if(response.message === 'wrong credentials'){
              signInForm.enable();
              this.buttonLoading = false;
              (signInForm.get('usernameEmail') as SignInFormControl).setValid(false, 'Credentials don\'t match');
              (signInForm.get('password') as SignInFormControl).setValid(false, 'Credentials don\'t match');
            }
          }
        })
      }
      
    }
  }
}
