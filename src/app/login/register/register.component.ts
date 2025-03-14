import { afterNextRender, Component, Inject, PLATFORM_ID, Renderer2, signal } from '@angular/core';
import { CommonModule, isPlatformBrowser, JsonPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient, HttpClientModule, HttpParams, HttpStatusCode } from '@angular/common/http';
import { FormService } from '../../shared/form.service';
import { BehaviorSubject, combineLatest, Observable, startWith, Subject } from 'rxjs';
import { RegisterInput, RegisterFormService, ProfileImageInput, Fields, RegisterFormResponse} from './classes';

@Component({
  selector: 'register-component',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule, CommonModule, HttpClientModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {

  profileImage: ProfileImageInput;
  usernameInput: RegisterInput;
  passwordInput: RegisterInput;
  emailInput: RegisterInput;

  registerInputs: Array<RegisterInput>;

  imageSrc: string | null = '';
  isBrowser: boolean = false;


  constructor(private renderer: Renderer2, @Inject(PLATFORM_ID) private platformId: Object, private httpClient: HttpClient, private formService: FormService){
    
    //provide access to HttpClient for RegisterInput
    RegisterInput.httpClient = this.httpClient;

    //provide access to Renderer2 and platformId for ProfileImageInput
    ProfileImageInput.renderer = this.renderer;
    ProfileImageInput.isPlatformBrowser = isPlatformBrowser;
    ProfileImageInput.platformId = this.platformId;

    //create Register Inputs
    this.profileImage = new ProfileImageInput();
    this.usernameInput = new RegisterInput({name: 'username', formControlValidators: [Validators.required, Validators.minLength(3)]});
    this.passwordInput = new RegisterInput({name: 'password', formControlValidators: [Validators.required, Validators.minLength(3)]});
    this.emailInput = new RegisterInput({name: 'email', formControlValidators: [Validators.minLength(3), Validators.email]});

    //combine all in array
    this.registerInputs = [this.usernameInput, this.passwordInput, this.emailInput];
    
    //on form change update formService
    combineLatest([
      this.profileImage.image,
      this.usernameInput.formControl.valueChanges, 
      this.passwordInput.formControl.valueChanges.pipe(startWith('')), 
      this.emailInput.formControl.valueChanges
    ]).subscribe(([profileImage, username, password, email]) => {

      //save to sessionStorage
      if(isPlatformBrowser(platformId) && window){
        window.sessionStorage.setItem('registerSavedProfileImage', this.profileImage.image.value?? '')
        window.sessionStorage.setItem('registerSavedUsername', this.usernameInput.formControl.value?? '');
        window.sessionStorage.setItem('registerSavedEmail', this.emailInput.formControl.value?? '');
      }

      //on image change update html src if all are valid, else set service empty (null)
      console.log(this.passwordInput.valid)
      if(this.emailInput.valid && this.passwordInput.valid && this.emailInput.valid)
        formService.registerFormService.next({profileImage: profileImage, username: username, password: password, email: email});
      else
        formService.registerFormService.next(null);
    })

    //on profile image change update image src
    this.profileImage.image.subscribe((profileImageData) => this.imageSrc = profileImageData);

    //listen for parent (submit button) response
    this.formService.registerFormResponse.subscribe((submitResponse) => {
      switch((submitResponse as RegisterFormResponse).state){

        //on waiting disable all inputs and wait
        case 'waiting': this.registerInputs.forEach((input: RegisterInput) => input.formControl.disable()); break;

        //on fail set classes and messages accordingly
        case 'fail': 
          this.registerInputs.forEach((input: RegisterInput) => input.formControl.enable());

          if(submitResponse?.fields){
            submitResponse.fields.forEach((field: Fields, fieldIndex: number) => {
             //TODO fields handling
              
            });
          }
          else{
            //TODO fields are empty (null)
          }
        break;
      }
    });
  }

  //get saved sessionStorage data and check
  ngOnInit(){
    if(isPlatformBrowser(this.platformId) && window){
      this.profileImage.image.next(window.sessionStorage.getItem('registerSavedProfileImage') ?? '');
    
      this.usernameInput.formControl.setValue(window.sessionStorage.getItem('registerSavedUsername') ?? '');
      this.usernameInput.getAvailability();

      this.emailInput.formControl.setValue(window.sessionStorage.getItem('registerSavedEmail') ?? '');
      this.emailInput.getAvailability();
    }
  }
  
}
