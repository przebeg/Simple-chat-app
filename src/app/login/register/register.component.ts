import {  Component, Inject, PLATFORM_ID, Renderer2 } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { RegisterService, RegisterFormControl, RegisterImageInput } from '../services/login.service';

@Component({
  selector: 'register-component',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule, CommonModule, HttpClientModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {

  imageIsDraggingFile: boolean = false;
  profileImageRemovable: boolean = false;

  registerForm: FormGroup;
  profileImageFormControl: RegisterImageInput;
  usernameFormControl: RegisterFormControl;
  passwordFormControl: RegisterFormControl;
  emailFormControl: RegisterFormControl;


  constructor (private registerService: RegisterService, private renderer: Renderer2, @Inject(PLATFORM_ID) private platformId: Object) {

    //define Register Forms
    this.registerForm = this.registerService.registerForm;
    
    this.profileImageFormControl = this.registerForm.get('profileImage') as RegisterImageInput;
    this.usernameFormControl = this.registerForm.get('username') as RegisterFormControl;
    this.passwordFormControl = this.registerForm.get('password') as RegisterFormControl;
    this.emailFormControl = this.registerForm.get('email') as RegisterFormControl;

    //get saved register data
    if(isPlatformBrowser(this.platformId) && window){
      [this.usernameFormControl, this.emailFormControl].forEach(control => {
        control.setValue(window.sessionStorage.getItem('registerSaved' + control.name[0].toUpperCase() + control.name.slice(1))?? '');
        this.registerService.getRegisterFormControlAvailability(control);
      });
      this.profileImageFormControl.imageData.next(window.sessionStorage.getItem('registerSavedProfileImage')?? '');

      //get saved image's extension
      const extMatch = this.profileImageFormControl.imageData.value.match(/^data:image\/([a-zA-Z]+);base64,/);
      this.profileImageFormControl.extension = extMatch ? extMatch[1] : 'undefined';
      if(this.profileImageFormControl.imageData.value.length > 10)
        this.profileImageFormControl.imageFile = this.imageDatatoFile(this.profileImageFormControl.imageData.value)
    }

    //on Register Inputs value change save to localStorage
    [this.usernameFormControl, this.emailFormControl].forEach(control => 
      control.valueChanges.subscribe((value) => {
        if(isPlatformBrowser(platformId) && window)
          window.sessionStorage.setItem('registerSaved' + control.name[0].toUpperCase() + control.name.slice(1), value);

        if(!control.available)
          control.setClear();
      })
    );
    this.profileImageFormControl.imageData.subscribe(value => {
      if(isPlatformBrowser(platformId) && window)
        window.sessionStorage.setItem('registerSavedProfileImage', (value?? '').toString())
    });
  }

  imageDatatoFile(imageData: string): File {
    const mimeMatch = imageData.match(/^data:(image\/[a-zA-Z]+);base64,/);
    if(!mimeMatch)
      throw new Error('Incorrect image data')
    
    const mimeType = mimeMatch[1];

    const byteString = atob(imageData.split(',')[1]);
    const byteArray = new Uint8Array(byteString.length);

    for (let i = 0; i < byteString.length; i++)
      byteArray[i] = byteString.charCodeAt(i);

    return new File([byteArray], 'profileImage', {type: mimeType})
  }

  imageInputClick(){
    if(this.profileImageFormControl.disabled)
      return;
    
    this.renderer.selectRootElement('#profile-image-input').click();
  }

  inputBlur(inputFormControl: RegisterFormControl){
    this.registerService.getRegisterFormControlAvailability(inputFormControl)
  }


  //profileImage input functions

  //process data after file drop/selection
  processFile(file: File){
    if(this.profileImageFormControl.disabled)
      return;

    if(file){
      this.profileImageFormControl.extension = file.name.split('.').at(-1)?? '';
      this.profileImageFormControl.imageFile = file;
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        this.profileImageFormControl.imageData.next((reader.result?? '').toString())
      }
    }
  }

  //handle drag and drop functionality
  onDragOver(event: DragEvent){
    if(this.profileImageFormControl.disabled)
      return;

    const target = event.target as HTMLElement;
    event.preventDefault();
    this.imageIsDraggingFile = true;
  }

  //handle on drag end
  onDragEnd(event: Event){
    if(this.profileImageFormControl.disabled)
      return;

    event.preventDefault();
    this.imageIsDraggingFile = false;
  }

  onFileDrop(event: DragEvent){
    if(this.profileImageFormControl.disabled)
      return;

    event.preventDefault();
    const file = event.dataTransfer?.files[0];
    if(file && (file.type === 'image/png' || file.type === 'image/jpg' || file.type === 'image/jpeg'))
      this.processFile(file);
    this.imageIsDraggingFile = false;
  }

  onFileSelect(event: any){
    if(this.profileImageFormControl.disabled)
      return;

    const file = event.target.files[0];
    this.processFile(file);
  }

  mouseOver(){
    if(this.profileImageFormControl.disabled)
      return;

    if(this.profileImageFormControl.imageData.value)
      this.profileImageRemovable = true;
  }

  mouseLeave(){
    if(this.profileImageFormControl.disabled)
      return;

    if(this.profileImageRemovable)
      this.profileImageRemovable = false;
  }

  removeClick(){
    if(this.profileImageFormControl.disabled)
      return;

    if(this.profileImageRemovable && this.profileImageFormControl.imageData.value.length > 3){
      this.profileImageFormControl.imageData.next('');
      console.log(this.profileImageFormControl.imageData.value)
      this.profileImageRemovable = false;
    }
  }

  //clear session storage after successful register
  clearSessionStorage() {
    if(isPlatformBrowser(this.platformId) && window){
      Object.keys(this.registerForm.controls).forEach(controlName => window.sessionStorage.setItem('registerSaved' + controlName, ''));
    }
  }




}
