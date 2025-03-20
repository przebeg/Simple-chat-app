import { HttpClient, HttpParams, HttpParamsOptions, HttpStatusCode } from '@angular/common/http';
import { Injectable, Directive, Renderer2 } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { RegisterFormResponse, RegisterFormService } from '../register/classes';
import { AbstractControl, FormControl, FormControlName, FormGroup, Validators } from '@angular/forms';
import { EventEmitter } from 'stream';

@Injectable({
  providedIn: 'root'
  
})
export class LoginService {

  submitButtonClick = new Subject<any>();

  registerForm: FormGroup = new FormGroup({
    profileImage: new RegisterImageInput({name: 'profileImage'}),
    username: new RegisterFormControl({name: 'username', formValidators: [Validators.required, Validators.minLength(3)]}),
    password: new RegisterFormControl({name: 'password', formValidators: [Validators.required, Validators.minLength(3)]}),
    email: new RegisterFormControl({name: 'email', formValidators: [Validators.email, Validators.minLength(3)]})
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
    this.httpClient.get<{status: HttpStatusCode | null, inputType: string, available: boolean, message: string}>('api/express/login/checkAvailability', {params})
    .subscribe(response => {
  
    const isResponseTypeEmail = response.inputType.toLowerCase() === 'email';
    console.log(response)
  
    if(isResponseTypeEmail === (registerFormControl.name === 'email'))
      registerFormControl.setValid(response.available, response.message?? '');
    else console.error('RESPONSE TYPE AND INPUT TYPE NOT MATCH')
  
    });
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
  imageData: BehaviorSubject<string>;

  constructor({name}: {name: string}) {
    super();

    this.name = name;
    this.imageData = new BehaviorSubject<string>('');
  }
}

