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

  imageIsDraggingFile: boolean = false;
  profileImageRemovable: boolean = false;

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

  imageInputClick(){
    if(this.profileImageFormControl.disabled)
      return;
    
    this.renderer.selectRootElement('#profile-image-input').click();
  }

  inputBlur(inputFormControl: RegisterFormControl){
    this.loginService.getRegisterFormControlAvailability(inputFormControl)
  }


  //profileImage input functions

  //process data after file drop/selection
  processFile(file: File){
    if(this.profileImageFormControl.disabled)
      return;

    if(file){
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
      this.profileImageRemovable = false;
    }
  }




}
