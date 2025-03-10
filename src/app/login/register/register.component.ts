import { afterNextRender, Component, Inject, PLATFORM_ID, Renderer2, signal } from '@angular/core';
import { CommonModule, isPlatformBrowser, JsonPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient, HttpClientModule, HttpParams, HttpStatusCode } from '@angular/common/http';
import { FormService } from '../../shared/form.service';
import { BehaviorSubject, combineLatest, Observable, startWith, Subject } from 'rxjs';

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
      this.username.valueChanges, 
      this.password.valueChanges.pipe(startWith('')), 
      this.email.valueChanges
    ]).subscribe(([profileImage, username, password, email]) => {

      //save to sessionStorage
      if(window){
        window.sessionStorage.setItem('registerSavedProfileImage', profileImage as string)
        window.sessionStorage.setItem('registerSavedUsername', username);
        window.sessionStorage.setItem('registerSavedEmail', email);
      }

      formService.registerFormChange({profilePicture: profileImage, username: username, password: password, email: email})
    })

    this.profileImage.subscribe((profileImageData) => this.imageSrc = profileImageData);


    //listen for parent (submit button) response
    interface Fields {
      type: string,
      valid: boolean,
      message: string
    }
    interface SubmitResponse {
      state: string //success, fail, waiting
      fields: Array<Fields>
    }
    const inputs = [
      {name: 'username', formControl: this.username, class: this.usernameInputClass, message: this.usernameInputMessage},
      {name: 'password', formControl: this.username, class: this.usernameInputClass, message: this.usernameInputMessage},
    ];
    this.formService.registerSubmitResponse.subscribe((submitResponse) => {
      switch((submitResponse as SubmitResponse).state){
        case 'waiting': inputs.forEach((input: FormControl) => input.disable()); break;
        case 'fail': 
          inputs.forEach((input: FormControl) => input.enable());
          (submitResponse as SubmitResponse).fields.forEach((field, fieldIndex) => {
            inputs[fieldIndex]
          })
      }
    })
  }

  ngOnInit(){

    //get saved sessionStorage data and check
    this.profileImage.next(window.sessionStorage.getItem('registerSavedProfileImage') ?? '');

    this.username.setValue(window.sessionStorage.getItem('registerSavedUsername') ?? '');
    this.getAvailability('username', this.username);

    this.email.setValue(window.sessionStorage.getItem('registerSavedEmail') ?? '');
    this.getAvailability('email', this.email);
  }

  //handle register form
  profileImage: Subject<string> = new Subject();
  usernameInput: object = {
    name: 'username', formControl: new FormControl('', [Validators.required, Validators.minLength(3)]), 
  };




  username: FormControl = new FormControl('', [Validators.required, Validators.minLength(3)]);
  password: FormControl = new FormControl('', [Validators.required]);
  email: FormControl = new FormControl('', [Validators.email, Validators.minLength(3)]);
  usernameInputClass: BehaviorSubject<string> = new BehaviorSubject('');
  emailInputClass: BehaviorSubject<string> = new BehaviorSubject('');
  usernameInputMessage: BehaviorSubject<string> = new BehaviorSubject('');
  emailInputMessage: BehaviorSubject<string> = new BehaviorSubject('');

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
        this.emailInputClass.next('');
      else this.usernameInputClass.next('');

      return;
    }

    //check client validators
    if(isEmail && !this.email.valid){
      this.emailInputClass.next('not-valid');
      this.emailInputMessage.next('Please provide a valid email');
      return;
    }
    if(!isEmail && !this.username.valid){
      this.usernameInputClass.next('not-valid');
      this.usernameInputMessage.next('Minimum 3 characters in length');
      return;
    }
    
    const params = new HttpParams()
      .set('type', type)
      .set('data', inputData);
    
    //set classes
    if(isEmail)
      this.emailInputClass.next('checking');
    else this.usernameInputClass.next('checking');

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
        this.emailInputClass.next(response.available? 'valid' : 'not-valid');
      else
        this.usernameInputClass.next(response.available? 'valid' : 'not-valid');

    })
  }
}
