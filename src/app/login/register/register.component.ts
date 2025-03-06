import { Component, Inject, PLATFORM_ID, Renderer2, signal } from '@angular/core';
import { CommonModule, isPlatformBrowser, JsonPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient, HttpClientModule, HttpParams, HttpStatusCode } from '@angular/common/http';

@Component({
  selector: 'register-component',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule, CommonModule, HttpClientModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {

  constructor(private renderer: Renderer2, @Inject(PLATFORM_ID) private platformId: Object, private httpClient: HttpClient){ }

  imageSrc: string | ArrayBuffer | null = null;
  isBrowser: boolean = false;
  isDraggingFile: boolean = false;

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
      reader.onload = e => {
        this.imageSrc = reader.result;
      }
    }
  }


  //handle register form
  username: FormControl = new FormControl('', [Validators.required, Validators.minLength(3)]);
  password: FormControl = new FormControl('', [Validators.required]);
  email: FormControl = new FormControl('', [Validators.email, Validators.minLength(3)]);
  usernameInputClass: string = '';
  emailInputClass: string = '';
  usernameInputMessage: string = '';
  emailInputMessage: string = '';
  

  //check for username and email availability
  getAvailability(type: string, callerInput: FormControl){

    const isEmail = type === 'email';
    const inputData = callerInput.value as string;

    if(inputData.length === 0){
      if(isEmail)
        this.emailInputClass = '';
      else this.usernameInputClass = '';

      return;
    }

    //check client validators
    if(isEmail && !this.email.valid){
      this.emailInputClass = 'not-valid';
      this.emailInputMessage = 'Please provide a valid email'
      return;
    }
    if(!isEmail && !this.username.valid){
      this.usernameInputClass = 'not-valid';
      this.usernameInputMessage = 'Minimum 3 characters in length'
      return;
    }
    
    const params = new HttpParams()
      .set('type', type)
      .set('data', inputData);
    
    //set classes
    if(isEmail)
      this.emailInputClass = 'checking';
    else this.usernameInputClass = 'checking';


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

      console.log(response.status)

      const isResponseTypeEmail = response.inputType.toLowerCase() === 'email';

      if(isResponseTypeEmail)
        this.emailInputClass = (response.available? 'valid' : 'not-valid');

      else
        this.usernameInputClass = (response.available? 'valid' : 'not-valid');
    })
  }

}
