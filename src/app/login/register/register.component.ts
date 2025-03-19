import { afterNextRender, Component, Inject, PLATFORM_ID, Renderer2, signal } from '@angular/core';
import { CommonModule, isPlatformBrowser, JsonPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient, HttpClientModule, HttpParams, HttpStatusCode } from '@angular/common/http';
import { LoginService, RegisterFormControl, RegisterImageInput } from '../services/login.service';
import { BehaviorSubject, combineLatest, Observable, startWith, Subject } from 'rxjs';
import { RegisterInput, ProfileImageInput, Field, RegisterFormResponse} from './classes';
import { Session } from 'inspector';

@Component({
  selector: 'register-component',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule, CommonModule, HttpClientModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {

  // profileImage: ProfileImageInput;

  // imageSrc: string | null = '';
  // isBrowser: boolean = false;

  // registerForm: FormGroup;
  // registerInputs = 


  // constructor(private renderer: Renderer2, @Inject(PLATFORM_ID) private platformId: Object, private httpClient: HttpClient, private loginService: LoginService){
    
  //   this.registerForm = loginService.registerForm;

  //   //provide access to HttpClient for RegisterInput
  //   RegisterInput.httpClient = this.httpClient;

  //   //provide access to Renderer2 and platformId for ProfileImageInput
  //   ProfileImageInput.renderer = this.renderer;
  //   ProfileImageInput.isPlatformBrowser = isPlatformBrowser;
  //   ProfileImageInput.platformId = this.platformId;

  //   //create Register Inputs
  //   this.profileImage = new ProfileImageInput();
  //   this.usernameInput = new RegisterInput({name: 'username', formControlValidators: [Validators.required, Validators.minLength(3)]});
  //   this.passwordInput = new RegisterInput({name: 'password', formControlValidators: [Validators.required, Validators.minLength(3)]});
  //   this.emailInput = new RegisterInput({name: 'email', formControlValidators: [Validators.minLength(3), Validators.email]});

  //   //combine all in array
  //   this.registerInputs = [this.usernameInput, this.passwordInput, this.emailInput];

  //   //add to registerloginService
  //   loginService.registerloginService.next({profileImage: this.profileImage, username: this.usernameInput, password: this.passwordInput, email: this.emailInput});
    
  //   //on form change update loginService
  //   combineLatest([
  //     this.profileImage.image,
  //     this.usernameInput.formControl.valueChanges, 
  //     this.passwordInput.formControl.valueChanges.pipe(startWith('')), 
  //     this.emailInput.formControl.valueChanges
  //   ]).subscribe(([profileImage, username, password, email]) => {

  //     //save to sessionStorage
  //     if(isPlatformBrowser(platformId) && window){
  //       window.sessionStorage.setItem('registerSavedProfileImage', this.profileImage.image.value?? '')
  //       window.sessionStorage.setItem('registerSavedUsername', this.usernameInput.formControl.value?? '');
  //       window.sessionStorage.setItem('registerSavedEmail', this.emailInput.formControl.value?? '');
  //     }

  //     //on inputs change update inputs
  //     //loginService.registerloginService.next({profileImage: this.profileImage, username: this.usernameInput, password: this.passwordInput, email: email});
  //   })

  //   //on profile image change update image src
  //   this.profileImage.image.subscribe((profileImageData) => this.imageSrc = profileImageData);

  //   //listen for parent (submit button) response
  //   this.loginService.registerFormResponse.subscribe((submitResponse) => {
  //     switch((submitResponse as RegisterFormResponse).state){

  //       //on waiting disable all inputs and wait
  //       case 'waiting': 
  //       //this.registerInputs.forEach((input: RegisterInput) => input.formControl.disable()); 
  //       break;

  //       //on fail set classes and messages accordingly
  //       case 'fail': 
  //         this.registerInputs.forEach((input: RegisterInput) => input.formControl.enable());

  //         if(submitResponse?.fields){
  //           submitResponse.fields.forEach((field: Field | undefined, fieldIndex: number) => {
  //            //TODO fields handling
              
  //           });
  //         }
  //         else{
  //           //TODO fields are empty (null)
  //         }
  //       break;
  //     }
  //   });
  // }


  registerForm: FormGroup;
  profileImageFormControl: RegisterImageInput;
  usernameFormControl: RegisterFormControl;
  passwordFormControl: RegisterFormControl;
  emailFormControl: RegisterFormControl;

  constructor (private loginService: LoginService, private renderer: Renderer2, @Inject(PLATFORM_ID) private platformId: Object) {
    this.registerForm = this.loginService.registerForm;
    
    this.profileImageFormControl = this.registerForm.get('profileImage') as RegisterImageInput;
    this.usernameFormControl = this.registerForm.get('username') as RegisterFormControl;
    this.passwordFormControl = this.registerForm.get('password') as RegisterFormControl;
    this.emailFormControl = this.registerForm.get('email') as RegisterFormControl;

    if(isPlatformBrowser(this.platformId) && window){
      [this.usernameFormControl, this.emailFormControl].forEach(control => {
        control.setValue(window.sessionStorage.getItem('registerSaved' + control.name[0].toUpperCase() + control.name.slice(1))?? '');
        this.loginService.getRegisterFormControlAvailability(control);
      });
      this.profileImageFormControl.imageData.next(window.sessionStorage.getItem('registerSavedProfileImage')?? '');
    }

    [this.profileImageFormControl, this.usernameFormControl, this.emailFormControl].forEach(control => 
      control.valueChanges.subscribe((value) => {
        if(isPlatformBrowser(platformId) && window)
          window.sessionStorage.setItem('registerSaved' + control.name[0].toUpperCase() + control.name.slice(1), value)
      })
    );
    this.profileImageFormControl.imageData.subscribe(value => {
      if(isPlatformBrowser(platformId) && window)
        window.sessionStorage.setItem('registerSavedProfileImage', value.toString())
    });
  }

  imageInputClick(){
    if(this.profileImageFormControl.disabled)
      return;
    
    this.renderer.selectRootElement('#profile-image-input').click();
  }

  inputBlur(inputFormControl: RegisterFormControl){
    this.loginService.getRegisterFormControlAvailability(inputFormControl)
  }



}
