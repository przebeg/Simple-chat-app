import { afterNextRender, Component, Inject, PLATFORM_ID, Renderer2, signal } from '@angular/core';
import { CommonModule, isPlatformBrowser, JsonPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient, HttpClientModule, HttpParams, HttpStatusCode } from '@angular/common/http';
import { FormService } from '../../shared/form.service';
import { BehaviorSubject, combineLatest, Observable, startWith, Subject } from 'rxjs';
import { RegisterInput, Fields, SubmitResponse } from './types';

@Component({
  selector: 'register-component',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule, CommonModule, HttpClientModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {


  constructor(private renderer: Renderer2, @Inject(PLATFORM_ID) private platformId: Object, private httpClient: HttpClient, private formService: FormService){
    
    //on form change update formService
    combineLatest([
      this.profileImage,
      this.usernameInput.formControl.valueChanges, 
      this.passwordInput.formControl.valueChanges.pipe(startWith('')), 
      this.emailInput.formControl.valueChanges
    ]).subscribe(([profileImage, username, password, email]) => {

      //save to sessionStorage
      if(window){
        window.sessionStorage.setItem('registerSavedProfileImage', profileImage as string)
        window.sessionStorage.setItem('registerSavedUsername', this.usernameInput.formControl.value?? '');
        window.sessionStorage.setItem('registerSavedEmail', this.emailInput.formControl.value?? '');
      }

      formService.registerFormChange({profilePicture: profileImage, username: username, password: password, email: email})
    })

    //on profile image change update image src
    this.profileImage.subscribe((profileImageData) => this.imageSrc = profileImageData);

    //listen for parent (submit button) response
    this.formService.registerSubmitResponse.subscribe((submitResponse) => {
      switch((submitResponse as SubmitResponse).state){

        //on waiting disable all inputs and wait
        case 'waiting': this.registerInputs.forEach((input: RegisterInput) => input.formControl.disable()); break;

        //on fail set classes and messages accordingly
        case 'fail': 
          this.registerInputs.forEach((input: RegisterInput) => input.formControl.enable());
          (submitResponse as SubmitResponse).fields.forEach((field: Fields, fieldIndex: number) => {

            const input = this.registerInputs.find((input: RegisterInput) => input.name === field.name) as RegisterInput;
            input.inputClass.next((field.valid? 'valid' : 'not-valid'));
            input.inputMessage.next(field.message);
          });
        break;
      }
    });
  }

  ngOnInit(){

    //get saved sessionStorage data and check
    this.profileImage.next(window.sessionStorage.getItem('registerSavedProfileImage') ?? '');
    
    const usernameInput: RegisterInput = this.registerInputs.find((input) => (input as RegisterInput).name === 'username') as RegisterInput;
    usernameInput.formControl.setValue(window.sessionStorage.getItem('registerSavedUsername') ?? '');
    this.getAvailability('username', usernameInput.formControl);

    const emailInput: RegisterInput = this.registerInputs.find((input) => (input as RegisterInput).name === 'email') as RegisterInput;
    emailInput.formControl.setValue(window.sessionStorage.getItem('registerSavedEmail') ?? '');
    this.getAvailability('email', emailInput.formControl);
  }

  //register form components
  profileImage: Subject<string> = new Subject();

  usernameInput: RegisterInput = {name: 'username', formControl: new FormControl('', [Validators.required, Validators.minLength(3)]), inputClass: new BehaviorSubject<string>(''), inputMessage: new BehaviorSubject<string>('')};
  passwordInput: RegisterInput = {name: 'password', formControl: new FormControl('', [Validators.required]), inputClass: new BehaviorSubject<string>(''), inputMessage: new BehaviorSubject<string>('')};
  emailInput: RegisterInput = {name: 'email', formControl: new FormControl('', [Validators.email, Validators.minLength(3)]), inputClass: new BehaviorSubject<string>(''), inputMessage: new BehaviorSubject<string>('')};

  //combine all in array
  registerInputs: Array<RegisterInput> = [this.usernameInput, this.passwordInput, this.emailInput];


  imageSrc: string | null = '';
  isBrowser: boolean = false;
  isDraggingFile: boolean = false;
  profileImageRemovable: boolean = false;

  //delegate click on profile image select
  profileImageInputClick(){
    this.renderer.selectRootElement('#profile-image-input').click();
  }

  //handle drag and drop functionality
  onDragOver(event: DragEvent){
    const target = event.target as HTMLElement;
    event.preventDefault();
    this.isDraggingFile = true;
  }

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
    this.processFile(file)
  }

  //process file after selecting one
  processFile(file: File){
    this.isBrowser = isPlatformBrowser(this.platformId);
    if(this.isBrowser){
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        this.profileImage.next(reader.result as string);
      }
    }
  }

  profileImageMouseOver(){
    if(this.imageSrc)
      this.profileImageRemovable = true;
  }

  profileImageMouseLeave(){
    if(this.profileImageRemovable)
      this.profileImageRemovable = false;
  }

  profileImageRemoveClick(){
    if(this.profileImageRemovable && this.imageSrc){
      this.profileImage.next('');
      this.profileImageRemovable = false;
    }
  }
  

  //check for username and email availability
  getAvailability(type: string, callerInput: FormControl){

    const isEmail = type === 'email';
    const inputData = callerInput.value as string;

    if(inputData.length === 0){
      if(isEmail)
        this.emailInput.inputClass.next('');
      else this.usernameInput.inputClass.next('');

      return;
    }

    //check client validators
    if(isEmail && !this.emailInput.formControl.valid){
      this.emailInput.inputClass.next('not-valid');
      console.log(this.emailInput.inputClass)
      this.emailInput.inputMessage.next('Please provide a valid email');
      return;
    }
    if(!isEmail && !this.usernameInput.formControl.valid){
      this.usernameInput.inputClass.next('not-valid');
      this.usernameInput.inputMessage.next('Minimum 3 characters in length');
      return;
    }
    
    const params = new HttpParams()
      .set('type', type)
      .set('data', inputData);
    
    //set classes
    if(isEmail)
      this.emailInput.inputClass.next('checking');
    else this.usernameInput.inputClass.next('checking');

    //interface for api response
    interface AvailabilityResponse {
      status: HttpStatusCode | null,
      inputType: string //"email" or "username"
      available: boolean;
      message: string
    }

    //get availability
    this.httpClient.get<AvailabilityResponse>('api/express/login/checkAvailability', {params})
    .subscribe(response => {

      const isResponseTypeEmail = response.inputType.toLowerCase() === 'email';
      console.log(response)

      if(isResponseTypeEmail)
        this.emailInput.inputClass.next(response.available? 'valid' : 'not-valid');
      else
        this.usernameInput.inputClass.next(response.available? 'valid' : 'not-valid');

    })
  }
}
