import { Component, Inject, PLATFORM_ID, Renderer2, signal } from '@angular/core';
import { CommonModule, isPlatformBrowser, JsonPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule, HttpParams } from '@angular/common/http';

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
  username: FormControl = new FormControl();
  password: FormControl = new FormControl();
  email: FormControl = new FormControl();
  usernameStatus: string | null = null;
  emailStatus: string | null = null;
  

  //check for username and email availability
  getAvailability(usernameOrEmail: string = ''){
    if(usernameOrEmail.length < 1)
      return;

    const isEmail = usernameOrEmail.includes('@');
    const params = new HttpParams()
      .set('data', usernameOrEmail);
    
    //set classes
    if(isEmail)
      this.emailStatus = 'checking';
    else this.usernameStatus = 'checking';

    //interface for api response
    interface AvailabilityResponse {
      available: boolean;
      message: string
    }

    //get availability
    this.httpClient.get<AvailabilityResponse>('api/express/check' + (isEmail? 'Email' : 'Username') + 'Availability', {params})
    .subscribe(response => {

      console.log(response)

      if(response.message.toLowerCase().includes('username'))
        this.usernameStatus = (response.available? 'valid' : 'not-valid');

      else if(response.message.toLowerCase().includes('email'))
        this.emailStatus = (response.available? 'valid' : 'not-valid');
    })
  }

}
