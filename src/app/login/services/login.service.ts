import { HttpClient, HttpParams, HttpStatusCode } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { RegisterComponent } from '../register/register.component';

@Injectable({
  providedIn: 'root'
})
export class RegisterService {

  submitButtonClick = new Subject<void>();

  registerForm: FormGroup = new FormGroup({
    profileImage: new RegisterImageInput({name: 'profileImage'}),
    username: new RegisterFormControl({name: 'username', formValidators: [Validators.required, Validators.minLength(3), Validators.maxLength(200)]}),
    password: new RegisterFormControl({name: 'password', formValidators: [Validators.required, Validators.minLength(3), Validators.maxLength(30)]}),
    email: new RegisterFormControl({name: 'email', formValidators: [Validators.email, Validators.minLength(3), Validators.maxLength(200)]})
  });

  constructor(private httpClient: HttpClient) {

    //on submit button check for empty register inputs
    this.submitButtonClick.subscribe((e) =>
      Object.values(this.registerForm.controls).filter((control) => control instanceof RegisterFormControl).forEach((registerFormControl) => registerFormControl.checkEmpty())
    );
  }

  public getRegisterFormControlAvailability(registerFormControl: RegisterFormControl){
    registerFormControl.available = false;
          
    if(registerFormControl.value.length === 0){
      registerFormControl.inputClass = '';
      registerFormControl.inputMessage = '';
      registerFormControl.available = false;
      return;
    }
  
    if(!registerFormControl.valid){
      registerFormControl.setValid(false, (registerFormControl.name === 'email'? 'Please provide a valid email' : 'Minimum 3 characters in length'))
      return;
    }
  
    //do not check on server if input type is password
    if(registerFormControl.name === 'password'){
      registerFormControl.setValid(true);
          return;
    }
  
    const params = new HttpParams()
      .set('type', registerFormControl.name)
      .set('data', registerFormControl.value);
              
    //set classes
    registerFormControl.inputClass = 'checking';
  
    //get availability
    this.httpClient.get<{status: HttpStatusCode | null, inputType: string, available: boolean, message: string}>('api/express/accounts/checkAvailability', {params})
    .subscribe(response => {
  
    const isResponseTypeEmail = response.inputType.toLowerCase() === 'email';
    console.log(response)
  
    if(isResponseTypeEmail === (registerFormControl.name === 'email'))
      registerFormControl.setValid(response.available, response.message?? '');
    else console.error('RESPONSE TYPE AND INPUT TYPE NOT MATCH')
  
    });
  }
}

@Injectable({
  providedIn: 'root'
})
export class SignInLoginService {

  submitButtonClick = new Subject<void>();

  signInForm: FormGroup = new FormGroup({
    usernameEmail: new SignInFormControl({name: 'usernameEmail', formValidators: [Validators.required, Validators.minLength(3), Validators.maxLength(200)]}),
    password: new SignInFormControl({name: 'password', formValidators: [Validators.required, Validators.minLength(3), Validators.maxLength(30)]})
  });

  constructor (private httpClient: HttpClient) {

    //on submit button check for empty sign-in inputs
    this.submitButtonClick.subscribe((e) =>
      Object.values(this.signInForm.controls).filter((control) => control instanceof SignInFormControl).forEach((signInFormControl) => signInFormControl.checkEmpty())
    );
  }
}

export class SignInFormControl extends FormControl {
  inputClass: string = '';
  inputMessage: string ='';
  name: string;

  public static inputBlur(input: SignInFormControl){

    //if input is empty
    if(input.value.length === 0){
      input.setClear();
      return;
    }

    //for when input is possibly an email
    if(input.name === 'usernameEmail' && (input.value.includes('@') || input.value.includes('.'))){
      console.log('x')
      input.addValidators(Validators.email);
      if(!input.valid){
        input.setValid(false, 'Please provide a valid email address');
        input.removeValidators(Validators.email);
      }
    }

    else{
      if(!input.valid && input.errors)
        input.setValid(false, (input.errors??['minLength']? "Minimum 3 characters in length" : "Maximum 200 characters in length"));
    }
  }

  constructor({formValue = '', formValidators, name}: {formValue?: string, formValidators?: Validators, name: string}) {
    super(formValue, formValidators);

    this.name = name;
  }

  public checkEmpty() {
    if(this.hasValidator(Validators.required) && this.value.length === 0)
      this.setValid(false, "This field is required");
  }

  public setValid(valid: boolean = true, message?: string) {
    this.inputClass = (valid? 'valid' : 'not-valid')
    this.inputMessage = message?? '';
  }

  public setClear() {
    this.inputClass = '';
    this.inputMessage = '';
  }
}

export class RegisterFormControl extends FormControl {

  inputClass: string = '';
  inputMessage: string = '';
  available: boolean = false;
  name: string;

  constructor({formValue = '', formValidators, name}: {formValue?: string, formValidators?: Validators, name: string}) {
    super(formValue, formValidators);

    this.name = name;
  }

  public checkEmpty() {
    if(this.hasValidator(Validators.required) && this.value.length === 0)
      this.setValid(false, "This field is required");
  }

  public setValid(available: boolean = true, message?: string) {
    this.available = available;
    this.inputClass = (this.available? 'valid' : 'not-valid')
    this.inputMessage = message?? '';
  }

  public setClear() {
    this.inputClass = '';
    this.inputMessage = '';
  }

}

export class RegisterImageInput extends FormControl {

  name: string;
  imageFile: Blob = new Blob();
  imageData: BehaviorSubject<string>;
  imageExtension: string = '';

  constructor({name}: {name: string}) {
    super();

    this.name = name;
    this.imageData = new BehaviorSubject<string>('');
  }

  set extension(extension: string){
    if(extension === 'png' || extension === 'jpg' || extension === 'jpeg')
      this.imageExtension = extension;
    else this.imageExtension = 'undefined'
  }
}

