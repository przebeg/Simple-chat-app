import { HttpClient, HttpParams, HttpParamsOptions, HttpStatusCode } from '@angular/common/http';
import { Injectable, Directive, Renderer2 } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { RegisterFormResponse, RegisterFormService } from '../register/classes';
import { AbstractControl, FormControl, FormControlName, FormGroup, Validators } from '@angular/forms';

@Injectable({
  providedIn: 'root'
  
})
export class LoginService {

  //sign-in
  private loginFormSubject = new BehaviorSubject<object>({
    usernameOrEmail: '',
    password: ''
  });
  loginForm = this.loginFormSubject.asObservable();
  loginFormChange(loginFormData: object){
    this.loginFormSubject.next(loginFormData);
  }

  //register form
  registerFormService = new BehaviorSubject<RegisterFormService>({
    profileImage: null,
    username: null,
    password: null,
    email: null
  });

  registerFormResponse = new Subject<RegisterFormResponse>();





  registerForm: FormGroup = new FormGroup({
    profileImage: new RegisterImageInput({name: 'profileImage'}),
    username: new RegisterFormControl({name: 'username', formValidators: [Validators.required, Validators.minLength(3)]}),
    password: new RegisterFormControl({name: 'password', formValidators: [Validators.required, Validators.minLength(3)]}),
    email: new RegisterFormControl({name: 'email', formValidators: [Validators.email, Validators.minLength(3)]})
  });

  constructor(private httpClient: HttpClient) { }

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
  
    if(isResponseTypeEmail === (registerFormControl.name === 'email'))
      registerFormControl.setValid(response.available, response.message?? '');
    else alert('RESPONSE TYPE AND INPUT TYPE NOT MATCH')
  
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

  public setValid(available: boolean = true, message?: string){
    this.available = available;
    this.inputClass = (this.available? 'valid' : 'not-valid')
    this.inputMessage = message?? '';
  }

}

export class RegisterImageInput extends FormControl {

  name: string;
  imageData: string = '';
  isDraggingFile: boolean = false;
  profileImageRemovable: boolean = false;
  profileImageInputElement: HTMLElement | null = null;

  constructor({name}: {name: string}) {
    super();

    this.name = name;
  }

  processFile(file: File){
    if(file){
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        this.imageData = reader.result as string;
      }
    }
  }

  //handle drag and drop functionality
  onDragOver(event: DragEvent){
    const target = event.target as HTMLElement;
    event.preventDefault();
    this.isDraggingFile = true;
  }
  
  //handle on drag end
  onDragEnd(event: Event){
    event.preventDefault();
    this.isDraggingFile = false;
  }

  onFileDrop(event: DragEvent){
    event.preventDefault();
    const file = event.dataTransfer?.files[0];
    if(file && (file.type === 'image/png' || file.type === 'image/jpg' || file.type === 'image/jpeg'))
      this.processFile(file);
    this.isDraggingFile = false;
  }

  onFileSelect(event: any){
    const file = event.target.files[0];
    this.processFile(file);
  }

  mouseOver(){
    if(this.imageData)
      this.profileImageRemovable = true;
  }

  mouseLeave(){
    if(this.profileImageRemovable)
      this.profileImageRemovable = false;
  }

  removeClick(){
    if(this.profileImageRemovable && this.imageData){
      this.imageData = '';
      this.profileImageRemovable = false;
    }
  }


}

